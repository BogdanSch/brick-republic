import mongoose, { Schema } from "mongoose";
import type { ThemeDto } from "../types/dtos.js";

export type Theme = {
  name: string;
  slug: string;
  description: string;
  visuals: {
    heroBanner?: string;
    icon: string;
  };
  toDto: () => ThemeDto;
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

ThemeSchema.methods.toDto = function (): ThemeDto {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    description: this.description,
    visuals: {
      heroBanner: this.visuals.heroBanner || null,
      icon: this.visuals.icon,
    },
  };
};

export default mongoose.model<Theme>("Theme", ThemeSchema);
