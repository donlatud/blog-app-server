import { Router } from "express";
import {
  createBlog,
  deleteBlog,
  getAdminBlog,
  listAdminBlogs,
  patchBlogStatus,
  updateBlog,
  uploadImage,
} from "../controllers/adminBlogController.js";
import {
  getAdminCommentPendingCount,
  listAdminComments,
  patchCommentStatus,
} from "../controllers/adminCommentController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { uploadSingleImage } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAdmin);

router.get("/blogs", asyncHandler(listAdminBlogs));
router.post("/blogs", asyncHandler(createBlog));
router.post(
  "/uploads",
  (req, res, next) => {
    uploadSingleImage(req, res, (error) => {
      if (error) {
        return next(
          error instanceof Error
            ? error
            : new Error("Failed to upload image.")
        );
      }

      return next();
    });
  },
  asyncHandler(uploadImage)
);
router.get("/blogs/:id", asyncHandler(getAdminBlog));
router.put("/blogs/:id", asyncHandler(updateBlog));
router.patch("/blogs/:id/status", asyncHandler(patchBlogStatus));
router.delete("/blogs/:id", asyncHandler(deleteBlog));

router.get("/comments", asyncHandler(listAdminComments));
router.get("/comments/pending-count", asyncHandler(getAdminCommentPendingCount));
router.patch("/comments/:id/status", asyncHandler(patchCommentStatus));

export default router;
