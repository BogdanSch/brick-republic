export type RegisterUserDto = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

export type LoginUserDto = {
  email: string;
  password: string;
};
