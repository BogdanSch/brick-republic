export type BaseAddress = {
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

export type UserProfile = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

export * from "./dtos.js";
