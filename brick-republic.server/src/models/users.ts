import mongoose, { Schema } from "mongoose";
import type { BaseAddress } from "../types/index.ts";

export type UserRole = "customer" | "admin";

type User = {
  email: string;
  passwordHash: string;
  role: UserRole;
  profile?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  permissions?: string[];
  adminProfile?: {
    department: string;
  };
  addresses?: [
    {
      label: string;
      isDefault: boolean;
    } & BaseAddress,
  ];
  wishlist?: [Schema.Types.ObjectId, Schema.Types.ObjectId];
  lastLogin?: Date;
  createdAt: Date;
};

const ProfileSchema = new Schema({
  firstName: { type: String, required: true, minLength: 2, maxLength: 200 },
  lastName: { type: String, required: true, minLength: 2, maxLength: 200 },
  phoneNumber: { type: String, required: true, match: /^\+?[1-9]\d{1,14}$/ },
});

const AdminProfileSchema = new Schema({
  department: { type: String, required: true },
});

const AddressSchema = new Schema({
  label: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, required: true, default: false },
});

const UserSchema = new Schema<User>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, minLength: 6 },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  profile: { type: ProfileSchema, required: false },
  adminProfile: { type: AdminProfileSchema, required: false },
  permissions: [{ type: String, required: false }],
  addresses: [AddressSchema],
  wishlist: [
    {
      type: Schema.Types.ObjectId,
      ref: "Minifigure",
      required: false,
    },
  ],
  lastLogin: { type: Date, required: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<User>("User", UserSchema);
