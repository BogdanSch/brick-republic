import mongoose, { Schema } from "mongoose";
import type { BaseAddress } from "../types/index.ts";
import { BaseAddressSchema } from "./schemas/baseAddressSchema.js";

type OpeningHoursDay = {
  open?: string;
  close?: string;
  isClosed: boolean;
};

type Store = {
  name: string;
  address: BaseAddress;
  location: {
    type: string;
    coordinates: [number, number];
  };
  openingHours: {
    monday: OpeningHoursDay;
    tuesday: OpeningHoursDay;
    wednesday: OpeningHoursDay;
    thursday: OpeningHoursDay;
    friday: OpeningHoursDay;
    saturday: OpeningHoursDay;
    sunday: OpeningHoursDay;
  };
};

const OpeningHoursDaySchema = new Schema(
  {
    open: { type: String, required: false, default: null },
    close: { type: String, required: false, default: null },
    isClosed: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const StoreSchema = new Schema<Store>({
  name: { type: String, required: true, minLength: 3 },
  address: { type: BaseAddressSchema, required: true },
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  openingHours: {
    type: {
      monday: { type: OpeningHoursDaySchema, required: true },
      tuesday: { type: OpeningHoursDaySchema, required: true },
      wednesday: { type: OpeningHoursDaySchema, required: true },
      thursday: { type: OpeningHoursDaySchema, required: true },
      friday: { type: OpeningHoursDaySchema, required: true },
      saturday: { type: OpeningHoursDaySchema, required: true },
      sunday: { type: OpeningHoursDaySchema, required: true },
    },
    required: true,
  },
});
StoreSchema.index({ location: "2dsphere" });

export default mongoose.model<Store>("Store", StoreSchema);
