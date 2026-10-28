import mongoose, { Schema } from "mongoose";
import { BaseAddressSchema } from "./schemas/baseAddressSchema.js";
import type { BaseAddress, OrderDto } from "shared/types/index.ts";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type MinifigureOrder = {
  minifigureId: mongoose.Types.ObjectId;
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
  storeId: mongoose.Types.ObjectId;
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
  customerId: mongoose.Types.ObjectId;
  orderDate: Date;
  status: OrderStatus;
  fulfillmentMethod: OrderFulfillmentMethod;
  items: MinifigureOrder[];
  shipment?: Shipment;
  pickup?: Pickup;
  financials: Financials;
  toDto: () => OrderDto;
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
    required: true,
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
OrderSchema.index({ orderDate: -1 });

OrderSchema.methods.toDto = function (): OrderDto {
  const shipment = this.shipment
    ? {
        ...this.shipment,
        shippingCost: parseFloat(this.shipment.shippingCost.toString()),
      }
    : undefined;

  const pickup = this.pickup
    ? {
        storeId: this.pickup.storeId.toString(),
        name: this.pickup.name,
        storeAddress: this.pickup.storeAddress,
        expectedPickupDate: this.pickup.expectedPickupDate,
      }
    : undefined;

  return {
    id: this._id.toString(),
    customerId: this.customerId.toString(),
    orderDate: this.orderDate,
    status: this.status,
    fulfillmentMethod: this.fulfillmentMethod,
    items: this.items.map((item: any) => ({
      minifigureId: item.minifigureId.toString(),
      name: item.name,
      condition: item.condition,
      quantity: item.quantity,
      priceAtPurchase: parseFloat(item.priceAtPurchase.toString()),
    })),
    ...(shipment ? { shipment } : {}),
    ...(pickup ? { pickup } : {}),
    financials: {
      itemsTotal: parseFloat(this.financials.itemsTotal.toString()),
      shippingTotal: parseFloat(this.financials.shippingTotal.toString()),
      finalTotal: parseFloat(this.financials.finalTotal.toString()),
    },
  };
};

export default mongoose.model<Order>("Order", OrderSchema);
