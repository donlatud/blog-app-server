export function getSupabaseJwtRole(key) {
  if (!key || typeof key !== "string") {
    return null;
  }

  const parts = key.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );

    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function assertServiceRoleKey(key) {
  const role = getSupabaseJwtRole(key);

  if (role && role !== "service_role") {
    console.warn(
      `[blog-app-server] SUPABASE_SERVICE_ROLE_KEY has role "${role}" — expected "service_role". Storage uploads and admin writes may fail with RLS errors.`
    );
  }

  return role === "service_role";
}
