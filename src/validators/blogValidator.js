const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateBlogSlug(slug) {
  if (typeof slug !== "string" || !slug.trim()) {
    return "Slug is required.";
  }

  const trimmed = slug.trim();

  if (!SLUG_REGEX.test(trimmed)) {
    return "Slug may only contain lowercase letters, numbers, and hyphens.";
  }

  if (trimmed.length > 120) {
    return "Slug must be at most 120 characters.";
  }

  return null;
}

export function validateBlogPayload(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      errors.push("Title is required.");
    } else if (title.length > 200) {
      errors.push("Title must be at most 200 characters.");
    }
  }

  if (!partial || body.slug !== undefined) {
    const slugError = validateBlogSlug(
      typeof body.slug === "string" ? body.slug : ""
    );
    if (slugError) {
      errors.push(slugError);
    }
  }

  if (!partial || body.excerpt !== undefined) {
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    if (excerpt.length > 500) {
      errors.push("Excerpt must be at most 500 characters.");
    }
  }

  if (!partial || body.content !== undefined) {
    const content = typeof body.content === "string" ? body.content : "";
    if (!partial && !content.trim()) {
      errors.push("Content is required.");
    }
  }

  if (body.status !== undefined) {
    if (body.status !== "draft" && body.status !== "published") {
      errors.push("Status must be draft or published.");
    }
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      errors.push("Images must be an array.");
    } else if (body.images.length > 6) {
      errors.push("A blog may have at most 6 additional images.");
    }
  }

  return errors;
}
