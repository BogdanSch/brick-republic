import express, { type Request, type Response } from "express";
import mongoose from "mongoose";
import {
  authenticateToken,
  authorizeRoles,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import { Order, Minifigure, Store } from "@models/index.js";
import type { MinifigureOrder } from "@models/order.js";
import type {
  CreateOrderDto,
  OrderDto,
  OrderStatus,
  PatchOrderDto,
  TokenPayload,
} from "shared/types/index.js";

const DELIVERY_TARRIF: number = 4.6;
const router = express.Router();

class OrderRequestError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "OrderRequestError";
  }
}

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
          const dto = Order.hydrate(o).toDto();
          dto.customerEmail = o.customerEmail;
          dto.customerProfile = o.customerProfile;
          return dto;
        }),
      });
    } catch (e) {
      console.error("Error fetching all orders: " + e);
      res.status(500).json({ message: "Error fetching all orders" });
    }
  },
);

router.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    let session: mongoose.ClientSession | undefined;

    try {
      const transactionSession = await mongoose.startSession();
      session = transactionSession;
      const createdOrder: OrderDto = await transactionSession.withTransaction(
        async () => {
          const dto = req.body as CreateOrderDto;
          const decodedToken = req.user as TokenPayload;

          let itemsTotal: number = 0;
          const orderItems: MinifigureOrder[] = [];

          for (const item of dto.items) {
            if (item.condition !== "new" && item.condition !== "used") {
              throw new OrderRequestError(400, "Invalid item condition.");
            }
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
              throw new OrderRequestError(400, "Invalid item quantity.");
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
              { returnDocument: "after", session: transactionSession },
            );
            if (!minifigure) {
              throw new OrderRequestError(
                409,
                `Insufficient stock for ${item.minifigureName} (${item.condition} condition). Order cancelled.`,
              );
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
                shippingAddress: NonNullable<
                  CreateOrderDto["shipment"]
                >["shippingAddress"];
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

          switch (dto.fulfillmentMethod) {
            case "pickup": {
              if (!dto.pickup?.storeId) {
                throw new OrderRequestError(400, "Select a pickup store.");
              }

              const store = await Store.findById(dto.pickup.storeId).session(
                transactionSession,
              );
              if (!store) {
                throw new OrderRequestError(
                  404,
                  "Selected pickup store not found.",
                );
              }

              pickup = {
                storeId: store._id,
                name: store.name,
                storeAddress: store.address,
              };
              break;
            }
            case "delivery": {
              if (!dto.shipment?.shippingAddress) {
                throw new OrderRequestError(400, "Provide a delivery address.");
              }

              shippingTotal = DELIVERY_TARRIF;
              shipment = {
                shippingAddress: dto.shipment.shippingAddress,
                shippingCost: mongoose.Types.Decimal128.fromString(
                  shippingTotal.toString(),
                ),
              };
              break;
            }
            default:
              throw new OrderRequestError(400, "Invalid fulfillment method.");
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

          await order.save({ session: transactionSession });
          return order.toDto();
        },
      );
      return res.status(201).json(createdOrder);
    } catch (e) {
      if (e instanceof OrderRequestError) {
        return res.status(e.statusCode).json({ message: e.message });
      }

      console.error("Error creating order:", e);
      return res.status(500).json({ message: "Error creating order" });
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  },
);

router.patch(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as PatchOrderDto;
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updateFields: Record<string, any> = {
        status: dto.status,
      };

      if (order.fulfillmentMethod === "delivery" && dto.shipment) {
        if (dto.shipment.carrier !== undefined) {
          updateFields["shipment.carrier"] = dto.shipment.carrier;
        }
        if (dto.shipment.trackingNumber !== undefined) {
          updateFields["shipment.trackingNumber"] = dto.shipment.trackingNumber;
        }
        if (dto.shipment.estimatedDeliveryDate !== undefined) {
          updateFields["shipment.estimatedDeliveryDate"] = new Date(
            dto.shipment.estimatedDeliveryDate,
          );
        }
      } else if (order.fulfillmentMethod === "pickup" && dto.pickup) {
        if (
          dto.pickup.expectedPickupDate !== undefined &&
          dto.pickup.expectedPickupDate !== ""
        ) {
          updateFields["pickup.expectedPickupDate"] = new Date(
            dto.pickup.expectedPickupDate,
          );
        }
      }
      if (Object.keys(updateFields).length === 0) {
        return res
          .status(400)
          .json({ message: "No valid fields provided for update." });
      }

      await Order.updateOne({ _id: order._id }, { $set: updateFields });
      return res.sendStatus(204);
    } catch (e) {
      console.error("Error updating order: " + e);
      return res.status(500).json({ message: "Error updating order" });
    }
  },
);

export default router;
