import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import type {
  UserAddressDto,
  BaseAddress,
  UserProfile,
  UserDto,
  UserRole,
} from "shared/types/index.js";
import { baseAddressDefinition } from "./schemas/baseAddressSchema.js";

type UserAddress = BaseAddress & {
  _id: mongoose.Types.ObjectId;
  isDefault: boolean;
};

type User = {
  email: string;
  password: string;
  role: UserRole;
  profile?: UserProfile;
  adminProfile?: {
    department: string;
  };
  addresses?: [UserAddress];
  wishlist?: [mongoose.Types.ObjectId];
  lastLogin?: Date;
  createdAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  toDto: () => UserDto;
};

const SALT_WORK_FACTOR: number = 10;

const ProfileSchema = new Schema(
  {
    firstName: { type: String, required: true, minLength: 2, maxLength: 200 },
    lastName: { type: String, required: true, minLength: 2, maxLength: 200 },
    phoneNumber: { type: String, required: true, match: /^\+?[1-9]\d{1,14}$/ },
  },
  { _id: false },
);

const AdminProfileSchema = new Schema(
  {
    department: { type: String, required: true },
  },
  { _id: false },
);

export const UserAddressSchema = new Schema(
  {
    ...baseAddressDefinition,
    isDefault: { type: Boolean, required: true, default: false },
  },
  { _id: true },
);

const UserSchema = new Schema<User>({
  email: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true, minLength: 7 },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  profile: { type: ProfileSchema, required: false },
  adminProfile: { type: AdminProfileSchema, required: false },
  addresses: [UserAddressSchema],
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

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toDto = function () {
  return {
    email: this.email,
    role: this.role,
    profile: this.profile,
    adminProfile: this.adminProfile,
    addresses: this.addresses?.map((address: UserAddress): UserAddressDto => ({
      id: address._id.toString(),
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    })),
    wishlist: this.wishlist,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

export default mongoose.model<User>("User", UserSchema);
