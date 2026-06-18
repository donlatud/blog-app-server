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

const ADMIN_LIST_COLUMNS =
  "id, title, slug, cover_image_url, published_at, view_count, status, created_at";

export async function findAdminBlogs({ status, limit, offset }) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  let query = supabase
    .from("blogs")
    .select(ADMIN_LIST_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
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

export async function findBlogById(id) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { data: blog, error } = await supabase
    .from("blogs")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      content,
      cover_image_url,
      status,
      view_count,
      published_at,
      created_at,
      updated_at
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "DATABASE_ERROR", error.message);
  }

  if (!blog) {
    throw new ApiError(404, "BLOG_NOT_FOUND", "Blog not found");
  }

  const { data: images, error: imagesError } = await supabase
    .from("blog_images")
    .select("id, image_url, position")
    .eq("blog_id", id)
    .order("position", { ascending: true });

  if (imagesError) {
    throw new ApiError(500, "DATABASE_ERROR", imagesError.message);
  }

  return {
    ...blog,
    blog_images: images ?? [],
  };
}

export async function isSlugTaken(slug, excludeId = null) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  let query = supabase.from("blogs").select("id").eq("slug", slug).limit(1);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new ApiError(500, "DATABASE_ERROR", error.message);
  }

  return (data ?? []).length > 0;
}

export async function insertBlog({
  title,
  slug,
  excerpt,
  content,
  coverImageUrl,
  status,
}) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const now = new Date().toISOString();
  const publishedAt = status === "published" ? now : null;

  const { error: insertError } = await supabase.from("blogs").insert({
    title,
    slug,
    excerpt,
    content,
    cover_image_url: coverImageUrl || null,
    status,
    published_at: publishedAt,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      throw new ApiError(409, "SLUG_EXISTS", "This slug is already in use.");
    }

    throw new ApiError(500, "DATABASE_ERROR", insertError.message);
  }

  const { data, error: selectError } = await supabase
    .from("blogs")
    .select("id")
    .eq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new ApiError(500, "DATABASE_ERROR", selectError.message);
  }

  if (!data) {
    throw new ApiError(500, "DATABASE_ERROR", "Blog created but could not be loaded.");
  }

  return data.id;
}

export async function updateBlogById(id, fields) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { error } = await supabase.from("blogs").update(fields).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "SLUG_EXISTS", "This slug is already in use.");
    }

    throw new ApiError(500, "DATABASE_ERROR", error.message);
  }

  const { data, error: selectError } = await supabase
    .from("blogs")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (selectError) {
    throw new ApiError(500, "DATABASE_ERROR", selectError.message);
  }

  if (!data) {
    throw new ApiError(404, "BLOG_NOT_FOUND", "Blog not found");
  }

  return data.id;
}

export async function deleteBlogById(id) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { error } = await supabase.from("blogs").delete().eq("id", id);

  if (error) {
    throw new ApiError(500, "DATABASE_ERROR", error.message);
  }

  return id;
}

export async function replaceBlogImages(blogId, images) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { error: deleteError } = await supabase
    .from("blog_images")
    .delete()
    .eq("blog_id", blogId);

  if (deleteError) {
    throw new ApiError(500, "DATABASE_ERROR", deleteError.message);
  }

  if (!images.length) {
    return;
  }

  const rows = images.map((image, index) => ({
    blog_id: blogId,
    image_url: image.imageUrl,
    position: image.position ?? index + 1,
  }));

  const { error: insertError } = await supabase.from("blog_images").insert(rows);

  if (insertError) {
    throw new ApiError(500, "DATABASE_ERROR", insertError.message);
  }
}
