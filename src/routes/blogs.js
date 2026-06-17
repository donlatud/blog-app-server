import { Router } from "express";
import {
  getBlogBySlug,
  incrementBlogView,
  listPublishedBlogs,
} from "../controllers/blogController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listPublishedBlogs));
router.post("/:slug/view", asyncHandler(incrementBlogView));
router.get("/:slug", asyncHandler(getBlogBySlug));

export default router;
