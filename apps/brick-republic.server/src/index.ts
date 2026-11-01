import express from "express";
import type { Application, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import minifiguresRouter from "./features/minifigures.js";
import orderRouter from "./features/orders.js";
import storeRouter from "./features/stores.js";
import themeRouter from "./features/themes.js";
import accountRouter from "./features/account.js";

dotenv.config();
const app: Application = express();
const port: number = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

mongoose.connect(process.env.MONGO_URI!).then(() => {
  console.log("Connected to MongoDB");
});

app.use("/api/minifigures", minifiguresRouter);
app.use("/api/themes", themeRouter);
app.use("/api/stores", storeRouter);
app.use("/api/orders", orderRouter);
app.use("/api/account", accountRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
