import mongoose, { Schema } from "mongoose";

type Minifigure = {
  name: string;
  theme: {
    themeId: string;
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

export default mongoose.model<Minifigure>("Minifigure", MinifigureSchema);
