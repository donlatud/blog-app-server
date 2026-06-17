import { Router } from "express";
import blogsRouter from "./blogs.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ data: { status: "ok" } });
});

router.use("/blogs", blogsRouter);

export default router;
