import {
  getPublishedBlogBySlug,
  getPublishedBlogList,
  recordBlogView,
} from "../services/blogService.js";
import { getPaginationParams } from "../utils/pagination.js";

export async function listPublishedBlogs(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : "";

    const result = await getPublishedBlogList({
      search,
      page,
      limit,
      offset,
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getBlogBySlug(req, res, next) {
  try {
    const result = await getPublishedBlogBySlug(req.params.slug);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function incrementBlogView(req, res, next) {
  try {
    const result = await recordBlogView(req.params.slug);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
