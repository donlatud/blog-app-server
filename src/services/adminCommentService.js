import {
  countCommentsByStatus,
  findAdminComments,
  updateCommentStatus,
} from "../repositories/commentRepository.js";
import ApiError from "../utils/apiError.js";
import { COMMENT_STATUS } from "../constants/index.js";

function mapAdminComment(row) {
  const blog = Array.isArray(row.blogs) ? row.blogs[0] : row.blogs;

  return {
    id: row.id,
    authorName: row.author_name,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    blog: blog
      ? {
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
        }
      : null,
  };
}

export async function getAdminCommentList({ status, page, limit, offset }) {
  const { items, total } = await findAdminComments({ status, limit, offset });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data: items.map(mapAdminComment),
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getPendingCommentCount() {
  const count = await countCommentsByStatus(COMMENT_STATUS.PENDING);
  return { data: { count } };
}

export async function patchAdminCommentStatus(id, status) {
  const allowed = [
    COMMENT_STATUS.PENDING,
    COMMENT_STATUS.APPROVED,
    COMMENT_STATUS.REJECTED,
  ];

  if (!allowed.includes(status)) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Status must be pending, approved, or rejected."
    );
  }

  const comment = await updateCommentStatus(id, status);
  return { data: mapAdminComment(comment) };
}
