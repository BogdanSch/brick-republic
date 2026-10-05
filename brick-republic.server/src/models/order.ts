import mongoose, { Schema } from "mongoose";
import type { BaseAddress } from "../types/index.ts";

type MinifigureOrder = {
  minifigureId: Schema.Types.ObjectId;
  name: string;
  condition: string;
  quantity: number;
  priceAtPurchase: mongoose.Types.Decimal128;
};

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type OrderFulfillmentMethod = "delivery" | "pickup";

type Order = {
  customerId: Schema.Types.ObjectId;
  orderDate: Date;
  status: OrderStatus;
  fulfillmentMethod: OrderFulfillmentMethod;
  items: MinifigureOrder[];
  shipment?: {
    carrier: string;
    serviceLevel: string;
    trackingNumber: string;
    shippingCost: mongoose.Types.Decimal128;
    estimatedDeliveryDate: Date;
    shippingAddress: BaseAddress;
  };
  pickup?: {
    storeId: Schema.Types.ObjectId;
    name: string;
    storeAddress: BaseAddress;
    expectedPickupDate: Date;
  };
  financials: {
    itemsTotal: mongoose.Types.Decimal128;
    shippingTotal: mongoose.Types.Decimal128;
    finalTotal: mongoose.Types.Decimal128;
  };
};

const OrderSchema = new Schema<Order>({
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  orderDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ] as OrderStatus[],
    default: "pending",
  },
  fulfillmentMethod: {
    type: String,
    enum: ["delivery", "pickup"] as OrderFulfillmentMethod[],
    required: true,
  },
});

export default mongoose.model<Order>("Order", OrderSchema);
