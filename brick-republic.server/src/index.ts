import express from "express";
import type { Application, Request, Response } from "express";

const app: Application = express();
const port: number = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
