import express, { type Response } from "express";
import jwt from "jsonwebtoken";
import {
  authenticateToken,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import User from "../models/user.js";
import type {
  LoginUserDto,
  RegisterUserDto,
  TokenPayload,
} from "shared/types/index.js";

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

export default router;
