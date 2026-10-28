import express, { type Request, type Response } from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { Theme, Minifigure } from "../models/index.js";
import { getSlug } from "../models/theme.js";
import type { CreateThemeDto, UpdateThemeDto } from "shared/types/index.js";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const themes = await Theme.find();
    const themesDto = themes.map((theme) => theme.toDto());
    res.json({ items: themesDto });
  } catch (e) {
    res.status(500).json({ message: "Error fetching themes" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) {
      return res.status(404).json({ message: "Theme not found" });
    }
    res.json(theme.toDto());
  } catch (e) {
    res.status(500).json({ message: "Error fetching theme" });
  }
});

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as CreateThemeDto;

      const theme = new Theme({
        name: dto.name,
        slug: getSlug(dto.name),
        description: dto.description,
        visuals: {
          heroBanner: dto.visuals.heroBanner,
          icon: dto.visuals.icon,
        },
      });
      await theme.save();

      res.status(201).json(theme.toDto());
    } catch (e) {
      res.status(500).json({ message: "Error creating theme" });
    }
  },
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as UpdateThemeDto;
      const id = req.params.id as string;

      await Theme.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            name: dto.name,
            slug: getSlug(dto.name),
            description: dto.description,
            visuals: {
              icon: dto.visuals.icon,
              ...(dto.visuals.heroBanner
                ? { heroBanner: dto.visuals.heroBanner }
                : {}),
            },
          },
        },
      );

      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ message: "Error updating theme" });
    }
  },
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    const targetId: string = req.params.id?.toString() || "";
    try {
      const linkedMinifiguresExist = await Minifigure.exists({
        "theme.themeId": targetId,
      });

      if (linkedMinifiguresExist) {
        return res.status(409).json({
          message:
            "Cannot delete the theme. There are still minifigures assigned to it. Reassign or delete them first.",
        });
      }

      const deletedTheme = await Theme.findByIdAndDelete(targetId);
      if (!deletedTheme) {
        return res.status(404).json({ message: "Theme not found" });
      }

      res.sendStatus(204);
    } catch (e) {
      res
        .status(500)
        .json({ message: `Error deleting theme with id=${targetId}` });
    }
  },
);

export default router;
