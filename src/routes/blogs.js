import { Router } from "express";
import { listPublishedBlogs } from "../controllers/blogController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listPublishedBlogs));

export default router;
