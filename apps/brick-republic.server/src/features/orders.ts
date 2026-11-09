import express, { type Request, type Response } from "express";
import mongoose from "mongoose";
import {
  authenticateToken,
  authorizeRoles,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import { Order, Minifigure, Store } from "@models/index.js";
import type { MinifigureOrder, OrderStatus } from "@models/order.js";
import type { CreateOrderDto, TokenPayload } from "shared/types/index.js";

const DELIVERY_TARRIF: number = 4.6;
const router = express.Router();

router.get(
  "/my-orders",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const decodedToken = req.user as TokenPayload;

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

router.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto = req.body as CreateOrderDto;
      const decodedToken = req.user as TokenPayload;

      let itemsTotal: number = 0;
      const orderItems: MinifigureOrder[] = [];

      for (const item of dto.items) {
        if (item.condition !== "new" && item.condition !== "used") {
          return res.status(400).json({ message: "Invalid item condition." });
        }
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          return res.status(400).json({ message: "Invalid item quantity." });
        }
        const conditionKey: string =
          item.condition === "new"
            ? "stock.newCondition"
            : "stock.usedCondition";

        const minifigure = await Minifigure.findOneAndUpdate(
          {
            _id: item.minifigureId,
            [conditionKey]: {
              $gte: item.quantity,
            },
          },
          {
            $inc: { [conditionKey]: -item.quantity },
          },
          { returnDocument: "after" },
        );
        if (!minifigure) {
          return res.status(409).json({
            message: `Insufficient stock for ${item.minifigureName} (${item.condition} condition). Order cancelled.`,
          });
        }

        const unitPrice: mongoose.Types.Decimal128 =
          item.condition === "new"
            ? minifigure.pricing.retailPrice
            : minifigure.pricing.usedRetailPrice;

        itemsTotal += Number(unitPrice.toString()) * item.quantity;
        orderItems.push({
          minifigureId: minifigure._id,
          name: minifigure.name,
          condition: item.condition,
          quantity: item.quantity,
          priceAtPurchase: mongoose.Types.Decimal128.fromString(
            unitPrice.toString(),
          ),
        });
      }

      let shippingTotal: number = 0;
      let shipment:
        | {
            shippingAddress: NonNullable<CreateOrderDto["shipment"]>["shippingAddress"];
            shippingCost: mongoose.Types.Decimal128;
          }
        | undefined;
      let pickup:
        | {
            storeId: mongoose.Types.ObjectId;
            name: string;
            storeAddress: InstanceType<typeof Store>["address"];
          }
        | undefined;

      if (dto.fulfillmentMethod === "pickup") {
        if (!dto.pickup?.storeId) {
          return res.status(400).json({ message: "Select a pickup store." });
        }

        const store = await Store.findById(dto.pickup.storeId);
        if (!store) {
          return res
            .status(404)
            .json({ message: "Selected pickup store not found." });
        }

        pickup = {
          storeId: store._id,
          name: store.name,
          storeAddress: store.address,
        };
      } else if (dto.fulfillmentMethod === "delivery") {
        if (!dto.shipment?.shippingAddress) {
          return res
            .status(400)
            .json({ message: "Provide a delivery address." });
        }

        shippingTotal = DELIVERY_TARRIF;
        shipment = {
          shippingAddress: dto.shipment.shippingAddress,
          shippingCost: mongoose.Types.Decimal128.fromString(
            shippingTotal.toString(),
          ),
        };
      }
      const finalTotal: number = itemsTotal + shippingTotal;

      const order = new Order({
        customerId: decodedToken.userId,
        status: "pending",
        fulfillmentMethod: dto.fulfillmentMethod,
        ...(shipment ? { shipment } : {}),
        ...(pickup ? { pickup } : {}),
        financials: {
          itemsTotal: mongoose.Types.Decimal128.fromString(
            itemsTotal.toString(),
          ),
          shippingTotal: mongoose.Types.Decimal128.fromString(
            shippingTotal.toString(),
          ),
          finalTotal: mongoose.Types.Decimal128.fromString(
            finalTotal.toString(),
          ),
        },
        items: orderItems,
      });

      await order.save();
      res.status(201).json(order.toDto());
    } catch (e) {
      console.error("Error creating order:", e);
      res.status(500).json({ message: "Error creating order" });
    }
  },
);

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
