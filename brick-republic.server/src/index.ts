import express from "express";
import type { Application, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { authenticateToken, type TokenPayload } from "./middleware/auth.js";
import minifiguresRouter from "./features/minifigures.js";
import User from "./models/user.js";
import type { LoginUserDto, RegisterUserDto } from "./types/dtos.js";

dotenv.config();
const app: Application = express();
const port: number = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI!).then(() => {
  console.log("Connected to MongoDB");
});

app.post("/signup", async (req, res) => {
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
app.post("/login", async (req, res) => {
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
app.get("/users/me", authenticateToken, async (req, res) => {
  try {
    const token: string = req.headers.authorization?.split(" ")[1]!;
    const decodedToken = jwt.decode(token) as { userId: string; email: string };

    const user = await User.findOne({ _id: decodedToken.userId });
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
});

app.get("/minifigures", minifiguresRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
