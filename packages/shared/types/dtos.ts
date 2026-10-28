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

export type UserDto = {
  email: string;
  role: string;
  profile?: UserProfile;
  adminProfile?: {
    department: string;
  };
  addresses?: [
    {
      label: string;
      isDefault: boolean;
    } & BaseAddress,
  ];
  wishlist?: string[];
  lastLogin?: Date;
  createdAt: Date;
};

export type MinifigureDto = {
  id: string;
  name: string;
  theme: {
    slug: string;
    name: string;
  };
  yearReleased: number;
  pricing: {
    retailPrice: number;
  };
  stock: {
    newCondition: number;
    usedCondition: number;
  };
  accessories?: string[];
  tags?: string[];
};

export type CreateMinifigureDto = {
  name: string;
  themeId: string;
  yearReleased: number;
  retailPrice: number;
  stock: {
    newCondition: number;
    usedCondition: number;
  };
  accessories: string[];
  tags: string[];
};

export type UpdateMinifigureDto = {
  name: string;
  themeId: string;
  yearReleased: number;
  retailPrice: number;
  stock: {
    newCondition: number;
    usedCondition: number;
  };
  accessories: string[];
  tags: string[];
};

export type ThemeDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  visuals: {
    heroBanner?: string;
    icon: string;
  };
};

export type CreateThemeDto = {
  name: string;
  description: string;
  visuals: {
    heroBanner?: string;
    icon: string;
  };
};

export type UpdateThemeDto = {
  name: string;
  description: string;
  visuals: {
    heroBanner?: string;
    icon: string;
  };
};

export type StoreDto = {
  id: string;
  name: string;
  address: BaseAddress;
  location: {
    type: string;
    coordinates: number[];
  };
  openingHours: Record<
    string,
    { open?: string | null; close?: string | null; isClosed: boolean }
  >;
};

export type CreateStoreDto = Omit<StoreDto, "id">;
export type UpdateStoreDto = Omit<StoreDto, "id">;

export type OrderDto = {
  id: string;
  customerId: string;
  customerEmail?: string;
  customerProfile?: UserProfile;
  orderDate: Date;
  status: string;
  fulfillmentMethod: "delivery" | "pickup";
  items: Array<{
    minifigureId: string;
    name: string;
    condition: string;
    quantity: number;
    priceAtPurchase: number;
  }>;
  shipment?: {
    carrier: string;
    serviceLevel: string;
    trackingNumber: string;
    shippingCost: number;
    estimatedDeliveryDate: Date;
    shippingAddress: BaseAddress;
  };
  pickup?: {
    storeId: string;
    name: string;
    storeAddress: BaseAddress;
    expectedPickupDate: Date;
  };
  financials: {
    itemsTotal: number;
    shippingTotal: number;
    finalTotal: number;
  };
};

export type CreateOrderDto = Omit<
  OrderDto,
  "id" | "orderDate" | "status" | "financials" | "shippingCost"
>;
