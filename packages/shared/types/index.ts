export type UserRole = "customer" | "admin";

export type TokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

export type OrderStatus =
  "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export * from "./dtos";
