import {
  deleteBlogById,
  findBlogById,
  insertBlog,
  isSlugTaken,
  replaceBlogImages,
  updateBlogById,
} from "../repositories/blogRepository.js";
import ApiError from "../utils/apiError.js";
import { BLOG_STATUS } from "../constants/index.js";
import { validateBlogPayload } from "../validators/blogValidator.js";

function mapAdminBlogDetail(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    coverImageUrl: row.cover_image_url ?? "",
    status: row.status,
    viewCount: row.view_count ?? 0,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: (row.blog_images ?? []).map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      position: image.position,
    })),
  };
}

function normalizeImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter((image) => typeof image?.imageUrl === "string" && image.imageUrl.trim())
    .slice(0, 6)
    .map((image, index) => ({
      imageUrl: image.imageUrl.trim(),
      position: index + 1,
    }));
}

function parseBlogInput(body) {
  return {
    title: typeof body.title === "string" ? body.title.trim() : "",
    slug: typeof body.slug === "string" ? body.slug.trim() : "",
    excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() : "",
    content: typeof body.content === "string" ? body.content : "",
    coverImageUrl:
      typeof body.coverImageUrl === "string" ? body.coverImageUrl.trim() : "",
    status: body.status === BLOG_STATUS.PUBLISHED ? BLOG_STATUS.PUBLISHED : BLOG_STATUS.DRAFT,
    images: normalizeImages(body.images),
  };
}

async function assertUniqueSlug(slug, excludeId = null) {
  const taken = await isSlugTaken(slug, excludeId);

  if (taken) {
    throw new ApiError(409, "SLUG_EXISTS", "This slug is already in use.");
  }
}

export async function getAdminBlogById(id) {
  const blog = await findBlogById(id);
  return { data: mapAdminBlogDetail(blog) };
}

export async function createAdminBlog(body) {
  const errors = validateBlogPayload(body);

  if (errors.length > 0) {
    throw new ApiError(400, "VALIDATION_ERROR", errors[0]);
  }

  const input = parseBlogInput(body);
  await assertUniqueSlug(input.slug);

  const blogId = await insertBlog(input);
  await replaceBlogImages(blogId, input.images);

  const blog = await findBlogById(blogId);
  return { data: mapAdminBlogDetail(blog) };
}

export async function updateAdminBlog(id, body) {
  const errors = validateBlogPayload(body, { partial: false });

  if (errors.length > 0) {
    throw new ApiError(400, "VALIDATION_ERROR", errors[0]);
  }

  await findBlogById(id);
  const input = parseBlogInput(body);
  await assertUniqueSlug(input.slug, id);

  const now = new Date().toISOString();
  const existing = await findBlogById(id);
  const publishedAt =
    input.status === BLOG_STATUS.PUBLISHED
      ? existing.published_at ?? now
      : null;

  await updateBlogById(id, {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    cover_image_url: input.coverImageUrl || null,
    status: input.status,
    published_at: publishedAt,
  });

  await replaceBlogImages(id, input.images);

  const blog = await findBlogById(id);
  return { data: mapAdminBlogDetail(blog) };
}

export async function patchAdminBlogStatus(id, status) {
  if (status !== BLOG_STATUS.DRAFT && status !== BLOG_STATUS.PUBLISHED) {
    throw new ApiError(400, "VALIDATION_ERROR", "Status must be draft or published.");
  }

  const existing = await findBlogById(id);
  const now = new Date().toISOString();

  await updateBlogById(id, {
    status,
    published_at:
      status === BLOG_STATUS.PUBLISHED ? existing.published_at ?? now : null,
  });

  const blog = await findBlogById(id);
  return { data: mapAdminBlogDetail(blog) };
}

export async function removeAdminBlog(id) {
  await deleteBlogById(id);
  return { data: { success: true } };
}
