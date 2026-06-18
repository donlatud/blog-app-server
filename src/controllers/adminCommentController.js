import {
  getAdminCommentList,
  getPendingCommentCount,
  patchAdminCommentStatus,
} from "../services/adminCommentService.js";
import { getPaginationParams } from "../utils/pagination.js";

export async function listAdminComments(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const status =
      typeof req.query.status === "string" ? req.query.status.trim() : "pending";

    const result = await getAdminCommentList({
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

export async function getAdminCommentPendingCount(req, res, next) {
  try {
    const result = await getPendingCommentCount();
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function patchCommentStatus(req, res, next) {
  try {
    const status =
      typeof req.body.status === "string" ? req.body.status.trim() : "";

    const result = await patchAdminCommentStatus(req.params.id, status);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
