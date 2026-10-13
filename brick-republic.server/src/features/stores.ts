import express, { type Request, type Response } from "express";
import { Store } from "../models/index.js";
import type { CreateStoreDto, UpdateStoreDto } from "../types/dtos.js";

const router = express.Router();

router.get("/nearest", async (req: Request, res: Response) => {
  try {
  } catch (e) {
    res.status(500).json({ message: "Error fetching nearest stores" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const stores = await Store.find();
    res.json({ items: stores.map((s) => s.toDto()) });
  } catch (e) {
    res.status(500).json({ message: "Error fetching stores" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const dto = req.body as CreateStoreDto;
    const store = new Store(dto);
    await store.save();
    res.status(201).json(store.toDto());
  } catch (e) {
    res.status(500).json({ message: "Error creating store" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const dto = req.body as UpdateStoreDto;
    const store = await Store.findByIdAndUpdate(req.params.id, dto, {
      new: true,
    });
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.sendStatus(204);
  } catch (e) {
    res.status(500).json({ message: "Error updating store" });
  }
});

export default router;
