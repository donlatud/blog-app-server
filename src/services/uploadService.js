import crypto from "node:crypto";

import env from "../config/env.js";
import ApiError from "../utils/apiError.js";
import { getSupabaseJwtRole } from "../utils/supabaseKey.js";

const BUCKET = "blog-images";

function getExtension(fileName, mimeType) {
  const fromName = fileName?.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) {
    return fromName;
  }

  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";

  return "jpg";
}

function getPublicObjectUrl(objectPath) {
  const baseUrl = env.supabaseUrl.replace(/\/+$/, "");
  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

function assertUploadConfig() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const role = getSupabaseJwtRole(env.supabaseServiceRoleKey);

  if (role !== "service_role") {
    throw new ApiError(
      503,
      "SERVICE_MISCONFIGURED",
      `SUPABASE_SERVICE_ROLE_KEY is "${role ?? "invalid"}" — use the service_role secret from Supabase Dashboard → Settings → API (not the anon key).`
    );
  }
}

export async function uploadBlogImageFile(file) {
  assertUploadConfig();

  if (!file?.buffer?.length) {
    throw new ApiError(400, "VALIDATION_ERROR", "Image file is required.");
  }

  const extension = getExtension(file.originalname, file.mimetype);
  const objectPath = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const baseUrl = env.supabaseUrl.replace(/\/+$/, "");
  const uploadUrl = `${baseUrl}/storage/v1/object/${BUCKET}/${objectPath}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      apikey: env.supabaseServiceRoleKey,
      "Content-Type": file.mimetype || "application/octet-stream",
      "x-upsert": "false",
    },
    body: file.buffer,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const rawMessage =
      typeof body?.message === "string"
        ? body.message
        : typeof body?.error === "string"
          ? body.error
          : `Upload failed with status ${response.status}`;

    const message = rawMessage.includes("row-level security")
      ? "Storage upload blocked by RLS. Run supabase/patch-storage-rls.sql in Supabase SQL Editor, then redeploy backend with the service_role key."
      : rawMessage;

    throw new ApiError(500, "UPLOAD_ERROR", message);
  }

  return getPublicObjectUrl(objectPath);
}
