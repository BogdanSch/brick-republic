import express from "express";
import type { Application, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/user.js";
import type { LoginUserDto, RegisterUserDto } from "./dtos/index.js";

dotenv.config();
const app: Application = express();
const port: number = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI!).then(() => {
  console.log("Connected to MongoDB");
});

function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication token required",
    });
  }

  const token: string = authHeader.split(" ")[1]!;
  try {
    jwt.verify(token, process.env.JWT_SECRET_KEY!);
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

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

// Login
app.post("/login", async (req, res) => {
  const dto: LoginUserDto = req.body;
  const user = await User.findOne({ email: dto.email });

  if (!user || !user.comparePassword(dto.password)) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET_KEY!,
    {
      expiresIn: "1d",
    },
  );
  res.json({ token });
});

app.get("/profile", authenticateToken, (req, res) => {
  res.json({
    message: "Protected resource accessed successfully",
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
