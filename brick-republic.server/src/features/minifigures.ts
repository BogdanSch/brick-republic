import express, { type Request, type Response } from "express";
import { Minifigure, Theme } from "../models/index.js";
import type { QueryParams } from "../utils/queryParams.js";
import type {
  CreateMinifigureDto,
  UpdateMinifigureDto,
} from "../types/dtos.js";
import mongoose from "mongoose";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const query = req.query as QueryParams;

  const filters: Record<string, any> = {};
  if (query.theme) {
    filters["theme.name"] = query.theme;
  }
  filters["pricing.retailPrice"] = {};
  if (query.minPrice) {
    filters["pricing.retailPrice"].$gte = Number(query.minPrice);
  }
  if (query.maxPrice) {
    filters["pricing.retailPrice"].$lte = Number(query.maxPrice);
  }

  const minifigures = await Minifigure.find(filters);

  const minifiguresDto = await Promise.all(minifigures.map((mf) => mf.toDto()));
  res.json({ items: minifiguresDto });
});

router.get("/:id", async (req: Request, res: Response) => {
  const minifigure = await Minifigure.findById(req.params.id);
  if (!minifigure) {
    return res.status(404).json({
      message: "Minifigure not found",
    });
  }
  res.json(minifigure.toDto());
});

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as CreateMinifigureDto;

      const theme = await Theme.findById(dto.themeId);
      if (!theme) {
        return res.status(404).json({
          message: "The associated theme is not found",
        });
      }

      const minifigure = new Minifigure({
        name: dto.name,
        theme: {
          themeId: theme._id,
          slug: theme.slug,
          name: theme.name,
        },
        yearReleased: dto.yearReleased,
        pricing: {
          retailPrice: dto.retailPrice,
        },
        stock: {
          newCondition: dto.stock.newCondition,
          usedCondition: dto.stock.usedCondition,
        },
        accessories: dto.accessories,
        tags: dto.tags,
      });
      await minifigure.save();

      res.status(201).json(minifigure.toDto());
    } catch (e) {
      return res.status(500).json({
        message: "Error creating minifigure",
      });
    }
  },
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as UpdateMinifigureDto;

      const minifigure = await Minifigure.findById(req.params.id);
      if (!minifigure) {
        return res.status(404).json({
          message: "Minifigure not found",
        });
      }

      let theme: InstanceType<typeof Theme> | null = null;
      if (minifigure.theme.themeId.toString() != dto.themeId) {
        theme = await Theme.findById(dto.themeId);
        if (!theme) {
          return res.status(404).json({
            message: "The associated theme is not found",
          });
        }
      }

      // Rewrite to native update
      minifigure.name = dto.name;
      if (theme) {
        minifigure.theme.themeId = theme._id;
        minifigure.theme.slug = theme.slug;
        minifigure.theme.name = theme.name;
      }
      minifigure.pricing = {
        retailPrice: mongoose.Types.Decimal128.fromString(
          dto.retailPrice.toString(),
        ),
      };
      minifigure.yearReleased = dto.yearReleased;
      minifigure.stock = {
        newCondition: dto.stock.newCondition,
        usedCondition: dto.stock.usedCondition,
      };
      minifigure.accessories = dto.accessories;
      minifigure.tags = dto.tags;

      await minifigure.save();

      res.sendStatus(204);
    } catch (e) {
      return res.status(500).json({
        message: "Error updating minifigure",
      });
    }
  },
);

router.delete("/:id", async (req: Request, res: Response) => {
  const targetId: string | undefined = req.params.id?.toString();
  try {
    await Minifigure.deleteOne({ _id: req.params.id });
    res.sendStatus(204);
  } catch (e) {
    return res.status(500).json({
      message: `Error deleting minifigure with id=${targetId}`,
    });
  }
});

router.patch(
  "/batch/inflation",
  authenticateToken,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const inflationPercentage = req.body as number;
      if (inflationPercentage <= 0)
        return res
          .status(400)
          .json({ message: "Provide a valid positive percentage." });

      const result = await Minifigure.updateMany(
        {},
        {
          $set: {
            "pricing.retailPrice": {
              $round: [
                {
                  $multiply: [
                    "$pricing.retailPrice",
                    inflationPercentage / 100,
                  ],
                },
                2,
              ],
            },
          },
        },
      );

      res.status(200).json({
        message: `Successfully applied a ${inflationPercentage}% price increase.`,
        countUpdates: result.modifiedCount,
      });
    } catch (e) {
      return res.status(500).json({
        message: "Error updating minifigure",
      });
    }
  },
);

export default router;
