import express, { type Request, type Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {
  authenticateToken,
  authorizeRoles,
  type TokenPayload,
} from "../middleware/auth.js";
import { Order, Minifigure, Store } from "@models/index.js";
import type { OrderStatus } from "@models/order.js";
import type { CreateOrderDto } from "../types/dtos.js";

const DELIVERY_TARRIF: number = 4.6;
const router = express.Router();

router.get(
  "/my-orders",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const token: string = req.headers.authorization?.split(" ")[1]!;
      const decodedToken = jwt.decode(token) as {
        userId: string;
        email: string;
      };

      const orders = await Order.find({
        customerId: new mongoose.Types.ObjectId(decodedToken.userId),
      }).sort({
        orderDate: -1,
      });
      res.json({ items: orders.map((o) => o.toDto()) });
    } catch (e) {
      res.status(500).json({ message: "Error fetching user orders" });
    }
  },
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const queryFilter: Record<string, any> = {};
      if (req.query.status) {
        queryFilter.status = req.query.status.toString() as OrderStatus;
      }

      const orders = await Order.aggregate([
        {
          $match: queryFilter,
        },
        {
          $lookup: {
            from: "users",
            localField: "customerId",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        {
          $unwind: "$customerInfo",
        },
        {
          $addFields: {
            customerEmail: "$customerInfo.email",
            customerProfile: "$customerInfo.profile",
          },
        },
        {
          $sort: {
            orderDate: -1,
          },
        },
      ]);

      res.json({
        orders: orders.map((o) => {
          const dto = o.toDto();
          dto.customerEmail = o.customerEmail;
          dto.customerProfile = o.customerProfile;
          return dto;
        }),
      });
    } catch (e) {
      res.status(500).json({ message: "Error fetching all orders" });
    }
  },
);

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const dto = req.body as CreateOrderDto;
    const token = req.headers.authorization?.split(" ")[1]!;
    const decodedToken = jwt.decode(token) as TokenPayload;

    let itemsTotal: number = 0;
    for (const item of dto.items) {
      itemsTotal += item.priceAtPurchase * item.quantity;

      const conditionKey: string =
        item.condition === "new" ? "stock.newCondition" : "stock.usedCondition";
      await Minifigure.findByIdAndUpdate(item.minifigureId, {
        $inc: { [conditionKey]: -item.quantity },
      });
    }

    const shippingTotal: number =
      dto.fulfillmentMethod === "delivery" ? DELIVERY_TARRIF : 0;
    const finalTotal: number = itemsTotal + shippingTotal;

    if (dto.fulfillmentMethod === "pickup" && dto.pickup?.storeId) {
      const store = await Store.findById(dto.pickup.storeId);
      if (!store) {
        return res
          .status(404)
          .json({ message: "Selected pickup store not found." });
      }

      dto.pickup.name = store.name;
      dto.pickup.storeAddress = store.address;
    }

    const order = new Order({
      ...dto,
      customerId: decodedToken.userId,
      status: "pending",
      financials: {
        itemsTotal: mongoose.Types.Decimal128.fromString(itemsTotal.toString()),
        shippingTotal: mongoose.Types.Decimal128.fromString(
          shippingTotal.toString(),
        ),
        finalTotal: mongoose.Types.Decimal128.fromString(finalTotal.toString()),
      },
      items: dto.items.map((item) => ({
        ...item,
        priceAtPurchase: mongoose.Types.Decimal128.fromString(
          item.priceAtPurchase.toString(),
        ),
      })),
    });

    if (dto.fulfillmentMethod === "delivery" && order.shipment) {
      order.shipment.shippingCost = mongoose.Types.Decimal128.fromString(
        shippingTotal.toString(),
      );
    }

    await order.save();
    res.status(201).json(order.toDto());
  } catch (e) {
    res.status(500).json({ message: "Error creating order" });
  }
});

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body;

      const validStatuses = [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status provided" });
      }

      const order = await Order.updateOne(
        {
          _id: req.params.id,
        },
        {
          $set: {
            status: status,
          },
        },
      );
      if (order.modifiedCount != 1) {
        return res.status(404).json({ message: "Order not updated" });
      }

      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ message: "Error updating order status" });
    }
  },
);

export default router;
