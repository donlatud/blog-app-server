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
