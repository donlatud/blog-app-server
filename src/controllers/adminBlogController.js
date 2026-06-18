import {
  createAdminBlog,
  getAdminBlogById,
  patchAdminBlogStatus,
  removeAdminBlog,
  updateAdminBlog,
} from "../services/adminBlogService.js";
import { getAdminBlogList } from "../services/blogService.js";
import { uploadBlogImageFile } from "../services/uploadService.js";
import { getPaginationParams } from "../utils/pagination.js";
import ApiError from "../utils/apiError.js";

export async function listAdminBlogs(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const status =
      typeof req.query.status === "string" ? req.query.status.trim() : "all";

    const result = await getAdminBlogList({
      status,
      page,
      limit,
      offset,
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getAdminBlog(req, res, next) {
  try {
    const result = await getAdminBlogById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function createBlog(req, res, next) {
  try {
    const result = await createAdminBlog(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateBlog(req, res, next) {
  try {
    const result = await updateAdminBlog(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function patchBlogStatus(req, res, next) {
  try {
    const status =
      typeof req.body.status === "string" ? req.body.status.trim() : "";

    const result = await patchAdminBlogStatus(req.params.id, status);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteBlog(req, res, next) {
  try {
    const result = await removeAdminBlog(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, "VALIDATION_ERROR", "Image file is required.");
    }

    const url = await uploadBlogImageFile(req.file);
    return res.status(201).json({ data: { url } });
  } catch (error) {
    return next(error);
  }
}
