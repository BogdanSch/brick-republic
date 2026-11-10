import { Schema } from "mongoose";

export const baseAddressDefinition = {
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
};

export const BaseAddressSchema = new Schema(
  {
    ...baseAddressDefinition,
  },
  { _id: false },
);
