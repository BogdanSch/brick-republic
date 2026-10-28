export type UserRole = "customer" | "admin";

export type TokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

export * from "./dtos";
