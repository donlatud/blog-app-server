import { findPublishedBlogs } from "../repositories/blogRepository.js";
import ApiError from "../utils/apiError.js";

function mapBlogRow(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    coverImageUrl: row.cover_image_url ?? "",
    publishedAt: row.published_at,
    viewCount: row.view_count,
  };
}

export async function getPublishedBlogList({ search, page, limit, offset }) {
  try {
    const { items, total } = await findPublishedBlogs({ search, limit, offset });
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: items.map(mapBlogRow),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      "BLOG_LIST_ERROR",
      error?.message ?? "Failed to fetch published blogs"
    );
  }
}
