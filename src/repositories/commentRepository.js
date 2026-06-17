import crypto from "node:crypto";

import supabase from "../config/supabase.js";
import ApiError from "../utils/apiError.js";
import { BLOG_STATUS, COMMENT_STATUS } from "../constants/index.js";

export async function findApprovedCommentsByBlogId(blogId) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, author_name, body, created_at")
    .eq("blog_id", blogId)
    .eq("status", COMMENT_STATUS.APPROVED)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ApiError(500, "DATABASE_ERROR", error.message);
  }

  return data ?? [];
}

export async function insertComment({
  blogId,
  userId,
  authorName,
  body,
}) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const payload = {
    blog_id: blogId,
    user_id: userId,
    author_name: authorName,
    body,
    status: COMMENT_STATUS.PENDING,
  };

  const { error: insertError } = await supabase.from("comments").insert(payload);

  if (insertError) {
    throw new ApiError(500, "DATABASE_ERROR", insertError.message);
  }

  const { data, error: selectError } = await supabase
    .from("comments")
    .select("id, author_name, body, created_at, status")
    .eq("blog_id", blogId)
    .eq("user_id", userId)
    .eq("body", body)
    .eq("status", COMMENT_STATUS.PENDING)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new ApiError(500, "DATABASE_ERROR", selectError.message);
  }

  if (data) {
    return data;
  }

  return {
    id: crypto.randomUUID(),
    author_name: authorName,
    body,
    created_at: new Date().toISOString(),
    status: COMMENT_STATUS.PENDING,
  };
}

export async function findPublishedBlogIdBySlug(slug) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { data, error } = await supabase
    .from("blogs")
    .select("id")
    .eq("slug", slug)
    .eq("status", BLOG_STATUS.PUBLISHED)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "DATABASE_ERROR", error.message);
  }

  if (!data) {
    throw new ApiError(404, "BLOG_NOT_FOUND", "Blog not found");
  }

  return data.id;
}
