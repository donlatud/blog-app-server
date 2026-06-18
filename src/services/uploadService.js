import crypto from "node:crypto";

import supabase from "../config/supabase.js";
import ApiError from "../utils/apiError.js";

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

export async function uploadBlogImageFile(file) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  if (!file?.buffer?.length) {
    throw new ApiError(400, "VALIDATION_ERROR", "Image file is required.");
  }

  const extension = getExtension(file.originalname, file.mimetype);
  const objectPath = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    const message = error.message?.includes("row-level security")
      ? "Storage upload blocked. Use SUPABASE_SERVICE_ROLE_KEY (service_role, not anon) and run supabase/patch-storage-rls.sql."
      : error.message;

    throw new ApiError(500, "UPLOAD_ERROR", message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

  return data.publicUrl;
}
