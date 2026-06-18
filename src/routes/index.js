import { Router } from "express";
import adminRouter from "./admin.js";
import authRouter from "./auth.js";
import blogsRouter from "./blogs.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ data: { status: "ok" } });
});

router.use("/auth", authRouter);
router.use("/blogs", blogsRouter);
router.use("/admin", adminRouter);

export default router;
