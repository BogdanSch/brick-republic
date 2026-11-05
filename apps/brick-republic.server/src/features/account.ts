import express, { type Response } from "express";
import jwt from "jsonwebtoken";
import {
  authenticateToken,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import User from "../models/user.js";
import type {
  CreateUserAddressDto,
  LoginUserDto,
  RegisterUserDto,
  TokenPayload,
  UpdateUserProfileDto,
} from "shared/types/index.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/register", async (req, res) => {
  const dto: RegisterUserDto = req.body;

  const existingUser = await User.findOne({ email: dto.email });
  if (existingUser) {
    return res.status(409).json({
      message: "User already exists",
    });
  }

  try {
    const user = new User({
      email: dto.email,
      password: dto.password,
      role: "customer",
      profile: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
      },
    });
    await user.save();
  } catch (error) {
    return res.status(500).json({
      message: "Error registering user",
    });
  }

  res.status(201).json({
    message: "User registered successfully",
  });
});

router.post("/login", async (req, res) => {
  const dto: LoginUserDto = req.body;
  const user = await User.findOne({ email: dto.email });

  if (!user || !user.comparePassword(dto.password)) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    } as TokenPayload,
    process.env.JWT_SECRET_KEY!,
    {
      expiresIn: "1d",
    },
  );
  res.json({ token });
});

router.patch(
  "/me/profile",
  authenticateToken,
  async (request: AuthenticatedRequest, response: Response) => {
    try {
      const user = await User.findById(request.user?.userId);
      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      const profileData = request.body as UpdateUserProfileDto;

      if (!user.profile) {
        user.profile = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phoneNumber: profileData.phoneNumber,
        };
      } else {
        user.profile.firstName = profileData.firstName;
        user.profile.lastName = profileData.lastName;
        user.profile.phoneNumber = profileData.phoneNumber;
      }

      await user.save();

      return response.status(200).json(user.toDto());
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Failed to update user profile" });
    }
  },
);

router.get(
  "/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const decodedToken = req.user;

      const user = await User.findOne({ _id: decodedToken?.userId });
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.json(user.toDto());
    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }
  },
);

router.post(
  "/me/addresses",
  authenticateToken,
  async (request: AuthenticatedRequest, response: Response) => {
    try {
      const user = await User.findById(request.user?.userId);
      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      const newAddressData = request.body as CreateUserAddressDto;
      if (!user.addresses) {
        user.addresses = [] as any;
      }

      let shouldBeDefault: boolean = newAddressData.isDefault;
      if (!user.addresses?.length) {
        shouldBeDefault = true;
      }
      if (shouldBeDefault) {
        user.addresses?.forEach((addressElement) => {
          addressElement.isDefault = false;
        });
      }

      user.addresses?.push({
        _id: new mongoose.Types.ObjectId(),
        street: newAddressData.street,
        city: newAddressData.city,
        postalCode: newAddressData.postalCode,
        country: newAddressData.country,
        isDefault: shouldBeDefault,
      });

      await user.save();

      return response.status(201).json(user.toDto());
    } catch (error) {
      return response.status(500).json({ message: "Failed to add address" });
    }
  },
);

router.patch(
  "/me/addresses/:addressId/default",
  authenticateToken,
  async (request: AuthenticatedRequest, response: Response) => {
    try {
      const user = await User.findById(request.user?.userId);
      if (!user || !user.addresses) {
        return response.status(404).json({ message: "User not found" });
      }

      const targetAddressId = request.params.addressId;
      const targetAddress = user.addresses.find(
        (address) => String(address._id) === targetAddressId,
      );
      if (!targetAddress) {
        return response.status(404).json({ message: "Address not found" });
      }

      user.addresses.forEach((addressElement) => {
        addressElement.isDefault = false;
      });
      targetAddress.isDefault = true;
      await user.save();

      return response.status(200).json(user.toDto());
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Failed to set default address" });
    }
  },
);

router.delete(
  "/me/addresses/:addressId",
  authenticateToken,
  async (request: AuthenticatedRequest, response: Response) => {
    try {
      const user = await User.findById(request.user?.userId);
      if (!user || !user.addresses) {
        return response.status(404).json({ message: "User not found" });
      }

      const targetAddressId = request.params.addressId as string;
      const targetAddress = user.addresses.find(
        (address) => String(address._id) === targetAddressId,
      );
      if (!targetAddress) {
        return response.status(404).json({ message: "Address not found" });
      }

      const targetAddressIndex: number = user.addresses.indexOf(targetAddress);
      user.addresses.splice(targetAddressIndex, 1);

      await user.save();
      return response.sendStatus(204);
    } catch (error) {
      return response.status(500).json({ message: "Failed to delete address" });
    }
  },
);

export default router;
