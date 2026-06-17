import { getAdminBlogList } from "../services/blogService.js";
import { getPaginationParams } from "../utils/pagination.js";

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
