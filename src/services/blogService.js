import {
  findAdminBlogs,
  findPublishedBlogBySlug,
  findPublishedBlogs,
  incrementBlogViewCount,
} from "../repositories/blogRepository.js";
import ApiError from "../utils/apiError.js";
import { COMMENT_STATUS } from "../constants/index.js";

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

function mapBlogDetail(row, comments = []) {
  return {
    ...mapBlogRow(row),
    content: row.content ?? "",
    images: (row.blog_images ?? []).map(mapBlogImage),
    comments,
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
    const approvedComments = (blog.comments ?? []).filter(
      (comment) => comment.status === COMMENT_STATUS.APPROVED
    );
    const comments = approvedComments.map((comment) => ({
      id: comment.id,
      authorName: comment.author_name,
      body: comment.body,
      createdAt: comment.created_at,
    }));

    return { data: mapBlogDetail(blog, comments) };
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

function mapAdminBlogRow(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    coverImageUrl: row.cover_image_url ?? "",
    publishedAt: row.published_at,
    viewCount: row.view_count ?? 0,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getAdminBlogList({ status, page, limit, offset }) {
  try {
    const { items, total } = await findAdminBlogs({ status, limit, offset });
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: items.map(mapAdminBlogRow),
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
      "ADMIN_BLOG_LIST_ERROR",
      error?.message ?? "Failed to fetch admin blogs"
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
