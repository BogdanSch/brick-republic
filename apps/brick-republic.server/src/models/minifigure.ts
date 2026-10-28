import mongoose, { Schema } from "mongoose";
import type { MinifigureDto } from "../types/dtos.js";

type Minifigure = {
  name: string;
  theme: {
    themeId: mongoose.Types.ObjectId;
    slug: string;
    name: string;
  };
  yearReleased: number;
  pricing: {
    retailPrice: mongoose.Types.Decimal128;
  };
  stock: {
    newCondition: number;
    usedCondition: number;
  };
  accessories?: string[];
  tags?: string[];
  toDto: () => MinifigureDto;
};

const PricingSchema = new Schema(
  {
    retailPrice: { type: mongoose.Types.Decimal128, required: true, min: 0 },
  },
  { _id: false },
);

const StockSchema = new Schema(
  {
    newCondition: { type: Number, required: false, default: 0, min: 0 },
    usedCondition: { type: Number, required: false, default: 0, min: 0 },
  },
  { _id: false },
);

const ThemeReferenceSchema = new Schema(
  {
    themeId: { type: Schema.Types.ObjectId, ref: "Theme", required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
);

const MinifigureSchema = new Schema<Minifigure>({
  name: { type: String, required: true, minLength: 3 },
  theme: { type: ThemeReferenceSchema, required: true },
  yearReleased: { type: Number, required: true, min: 1978 },
  pricing: { type: PricingSchema, required: true },
  stock: { type: StockSchema, required: true },
  accessories: { type: [String], required: false, default: [] },
  tags: { type: [String], required: false, default: [] },
});

MinifigureSchema.methods.toDto = function (): MinifigureDto {
  return {
    id: this._id.toString(),
    name: this.name,
    theme: {
      slug: this.theme.slug,
      name: this.theme.name,
    },
    yearReleased: this.yearReleased,
    pricing: {
      retailPrice: parseFloat(this.pricing.retailPrice.toString()),
    },
    stock: {
      newCondition: this.stock.newCondition,
      usedCondition: this.stock.usedCondition,
    },
    accessories: this.accessories,
    tags: this.tags,
  };
};

export default mongoose.model<Minifigure>("Minifigure", MinifigureSchema);
