import supabase from "../config/supabase.js";
import ApiError from "../utils/apiError.js";
import { BLOG_STATUS } from "../constants/index.js";

const LIST_COLUMNS =
  "id, title, slug, excerpt, cover_image_url, published_at, view_count";

export async function findPublishedBlogs({ search, limit, offset }) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  let query = supabase
    .from("blogs")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("status", BLOG_STATUS.PUBLISHED)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    query = query.ilike("title", `%${trimmedSearch}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new ApiError(500, "DATABASE_ERROR", error.message);
  }

  return {
    items: data ?? [],
    total: count ?? 0,
  };
}

export async function findPublishedBlogBySlug(slug) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { data, error } = await supabase
    .from("blogs")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      content,
      cover_image_url,
      published_at,
      view_count,
      blog_images (
        id,
        image_url,
        position
      ),
      comments (
        id,
        author_name,
        body,
        created_at,
        status
      )
    `
    )
    .eq("slug", slug)
    .eq("status", BLOG_STATUS.PUBLISHED)
    .order("position", { foreignTable: "blog_images", ascending: true })
    .order("created_at", { foreignTable: "comments", ascending: true })
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "DATABASE_ERROR", error.message);
  }

  if (!data) {
    throw new ApiError(404, "BLOG_NOT_FOUND", "Blog not found");
  }

  return data;
}

export async function incrementBlogViewCount(slug) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { data: blog, error: fetchError } = await supabase
    .from("blogs")
    .select("id, view_count")
    .eq("slug", slug)
    .eq("status", BLOG_STATUS.PUBLISHED)
    .maybeSingle();

  if (fetchError) {
    throw new ApiError(500, "DATABASE_ERROR", fetchError.message);
  }

  if (!blog) {
    throw new ApiError(404, "BLOG_NOT_FOUND", "Blog not found");
  }

  const { data, error } = await supabase
    .from("blogs")
    .update({ view_count: (blog.view_count ?? 0) + 1 })
    .eq("id", blog.id)
    .select("view_count")
    .single();

  if (error) {
    throw new ApiError(500, "DATABASE_ERROR", error.message);
  }

  return data.view_count;
}
