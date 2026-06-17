import { Router } from "express";
import { listAdminBlogs } from "../controllers/adminBlogController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAdmin);

router.get("/blogs", asyncHandler(listAdminBlogs));

export default router;
