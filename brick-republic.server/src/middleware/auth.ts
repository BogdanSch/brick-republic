import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "../admin/roles.js";

export type TokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

export type AuthenticatedRequest = Request & {
  user?: TokenPayload;
};

export function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication token required",
    });
  }

  const token: string = authHeader.split(" ")[1]!;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!);
    (req as AuthenticatedRequest).user = decoded as TokenPayload;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: Function) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}
