import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import type { UserRole } from "../admin/roles.js";
import type { BaseAddress, UserProfile, UserDto } from "../types/index.js";

type User = {
  email: string;
  password: string;
  role: UserRole;
  profile?: UserProfile;
  adminProfile?: {
    department: string;
  };
  addresses?: [
    {
      label: string;
      isDefault: boolean;
    } & BaseAddress,
  ];
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

const AddressSchema = new Schema(
  {
    label: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const UserSchema = new Schema<User>({
  email: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true, minLength: 7 },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  profile: { type: ProfileSchema, required: false },
  adminProfile: { type: AdminProfileSchema, required: false },
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

UserSchema.pre("save", function (next: any) {
  if (!this.isModified("password")) return next();

  bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  });
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
    addresses: this.addresses,
    wishlist: this.wishlist,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

export default mongoose.model<User>("User", UserSchema);