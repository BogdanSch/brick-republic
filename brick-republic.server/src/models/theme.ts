import mongoose, { Schema } from "mongoose";

export type Theme = {
  name: string;
  slug: string;
  description: string;
  visuals: {
    heroBanner?: string;
    icon: string;
  };
};

export function getSlug(name: string): string {
  return name.toLowerCase().split(/[\s]/).join("-");
}

const VisualsSchema = new Schema(
  {
    heroBanner: { type: String, required: false, default: null },
    icon: { type: String, required: true },
  },
  { _id: false },
);

const ThemeSchema = new Schema<Theme>({
  name: { type: String, required: true, minLength: 3, maxLength: 260 },
  slug: {
    type: String,
    required: true,
    maxLength: 280,
  },
  description: { type: String, required: true, minLength: 10 },
  visuals: { type: VisualsSchema, required: true },
});

export default mongoose.model<Theme>("Theme", ThemeSchema);
