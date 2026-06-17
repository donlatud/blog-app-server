import { Router } from "express";
import {
  getBlogBySlug,
  incrementBlogView,
  listPublishedBlogs,
  postBlogComment,
} from "../controllers/blogController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listPublishedBlogs));
router.post("/:slug/comments", requireAuth, asyncHandler(postBlogComment));
router.post("/:slug/view", asyncHandler(incrementBlogView));
router.get("/:slug", asyncHandler(getBlogBySlug));

export default router;
