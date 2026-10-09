import mongoose, { Schema } from "mongoose";
import type { BaseAddress } from "../types/index.ts";
import { BaseAddressSchema } from "./schemas/baseAddressSchema.js";

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type MinifigureOrder = {
  minifigureId: Schema.Types.ObjectId;
  name: string;
  condition: string;
  quantity: number;
  priceAtPurchase: mongoose.Types.Decimal128;
};

type OrderFulfillmentMethod = "delivery" | "pickup";

type Shipment = {
  carrier: string;
  serviceLevel: string;
  trackingNumber: string;
  shippingCost: mongoose.Types.Decimal128;
  estimatedDeliveryDate: Date;
  shippingAddress: BaseAddress;
};

type Pickup = {
  storeId: Schema.Types.ObjectId;
  name: string;
  storeAddress: BaseAddress;
  expectedPickupDate: Date;
};

type Financials = {
  itemsTotal: mongoose.Types.Decimal128;
  shippingTotal: mongoose.Types.Decimal128;
  finalTotal: mongoose.Types.Decimal128;
};

type Order = {
  customerId: Schema.Types.ObjectId;
  orderDate: Date;
  status: OrderStatus;
  fulfillmentMethod: OrderFulfillmentMethod;
  items: MinifigureOrder[];
  shipment?: Shipment;
  pickup?: Pickup;
  financials: Financials;
};

const MinifigureOrderSchema = new Schema<MinifigureOrder>(
  {
    minifigureId: {
      type: Schema.Types.ObjectId,
      ref: "Minifigure",
      required: true,
    },
    name: { type: String, required: true },
    condition: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: {
      type: mongoose.Types.Decimal128,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const ShipmentSchema = new Schema<Shipment>(
  {
    carrier: { type: String, required: true },
    serviceLevel: { type: String, required: true },
    trackingNumber: { type: String, required: true },
    shippingCost: {
      type: Schema.Types.Decimal128,
      required: true,
      min: 0,
      default: 0,
    },
    estimatedDeliveryDate: { type: Date, required: true },
    shippingAddress: { type: BaseAddressSchema, required: true },
  },
  { _id: false },
);

const PickupSchema = new Schema<Pickup>(
  {
    storeId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    storeAddress: { type: BaseAddressSchema, required: true },
    expectedPickupDate: { type: Date, required: true },
  },
  { _id: false },
);

const FinancialsSchema = new Schema<Financials>(
  {
    itemsTotal: { type: Schema.Types.Decimal128, required: true, min: 0 },
    shippingTotal: { type: Schema.Types.Decimal128, required: true, min: 0 },
    finalTotal: { type: Schema.Types.Decimal128, required: true, min: 0 },
  },
  { _id: false },
);

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
  items: [MinifigureOrderSchema],
  shipment: { type: ShipmentSchema },
  pickup: { type: PickupSchema },
  financials: { type: FinancialsSchema, required: true },
});

export default mongoose.model<Order>("Order", OrderSchema);
