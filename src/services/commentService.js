import {
  findApprovedCommentsByBlogId,
  findPublishedBlogIdBySlug,
  insertComment,
} from "../repositories/commentRepository.js";
import ApiError from "../utils/apiError.js";
import { validateCommentBody } from "../validators/commentValidator.js";

function mapComment(row) {
  return {
    id: row.id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function getApprovedCommentsForBlog(blogId) {
  const comments = await findApprovedCommentsByBlogId(blogId);
  return comments.map(mapComment);
}

export async function createBlogComment(slug, authUser, body) {
  const validationError = validateCommentBody(body);

  if (validationError) {
    throw new ApiError(400, "VALIDATION_ERROR", validationError);
  }

  const blogId = await findPublishedBlogIdBySlug(slug);
  const trimmedBody = body.trim();

  const comment = await insertComment({
    blogId,
    userId: authUser.id,
    authorName: authUser.displayName,
    body: trimmedBody,
  });

  return {
    id: comment.id,
    authorName: comment.author_name,
    body: comment.body,
    createdAt: comment.created_at,
    status: comment.status,
  };
}
