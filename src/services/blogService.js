import {
  findPublishedBlogBySlug,
  findPublishedBlogs,
  incrementBlogViewCount,
} from "../repositories/blogRepository.js";
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

function mapBlogImage(row) {
  return {
    id: row.id,
    imageUrl: row.image_url,
    position: row.position,
  };
}

function mapBlogDetail(row) {
  return {
    ...mapBlogRow(row),
    content: row.content ?? "",
    images: (row.blog_images ?? []).map(mapBlogImage),
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

export async function getPublishedBlogBySlug(slug) {
  try {
    const blog = await findPublishedBlogBySlug(slug);
    return { data: mapBlogDetail(blog) };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      "BLOG_DETAIL_ERROR",
      error?.message ?? "Failed to fetch blog"
    );
  }
}

export async function recordBlogView(slug) {
  try {
    const viewCount = await incrementBlogViewCount(slug);
    return { data: { viewCount } };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      "BLOG_VIEW_ERROR",
      error?.message ?? "Failed to record blog view"
    );
  }
}
