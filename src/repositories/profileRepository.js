import supabase from "../config/supabase.js";
import ApiError from "../utils/apiError.js";

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
