import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export function authenticateToken(req: Request, res: Response, next: Function) {
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
