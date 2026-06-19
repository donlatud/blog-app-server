import supabase from "../config/supabase.js";
import ApiError from "../utils/apiError.js";
import { USER_ROLE } from "../constants/index.js";

function resolveDisplayName(authUser) {
  const fromMetadata =
    typeof authUser.user_metadata?.display_name === "string"
      ? authUser.user_metadata.display_name.trim()
      : "";

  if (fromMetadata) {
    return fromMetadata;
  }

  const email = typeof authUser.email === "string" ? authUser.email : "";
  const localPart = email.split("@")[0]?.trim();

  return localPart || "User";
}

export async function findProfileById(userId) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "DATABASE_ERROR", error.message);
  }

  if (!data) {
    throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
  }

  return data;
}

export async function ensureProfileForAuthUser(authUser) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, created_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (existingError) {
    throw new ApiError(500, "DATABASE_ERROR", existingError.message);
  }

  if (existing) {
    return existing;
  }

  const displayName = resolveDisplayName(authUser);
  const { error: insertError } = await supabase.from("profiles").insert({
    id: authUser.id,
    display_name: displayName,
    role: USER_ROLE.MEMBER,
  });

  if (insertError && insertError.code !== "23505") {
    throw new ApiError(500, "DATABASE_ERROR", insertError.message);
  }

  const { data: created, error: selectError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, created_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (selectError) {
    throw new ApiError(500, "DATABASE_ERROR", selectError.message);
  }

  if (!created) {
    throw new ApiError(
      404,
      "PROFILE_NOT_FOUND",
      "Profile not found. Check SUPABASE_SERVICE_ROLE_KEY and run supabase/patch-profile-rls.sql."
    );
  }

  return created;
}
