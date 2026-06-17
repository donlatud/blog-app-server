import supabase from "../config/supabase.js";
import { findProfileById } from "../repositories/profileRepository.js";
import ApiError from "../utils/apiError.js";
import { getAccessToken } from "../utils/authCookies.js";

function mapProfile(profile, email) {
  return {
    id: profile.id,
    email,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    createdAt: profile.created_at,
  };
}

export async function getUserFromAccessToken(accessToken) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  if (!accessToken) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired session");
  }

  return user;
}

export async function getCurrentUser(accessToken) {
  const user = await getUserFromAccessToken(accessToken);
  const profile = await findProfileById(user.id);
  return mapProfile(profile, user.email ?? "");
}

export async function registerMember({ email, password, displayName }) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const trimmedName = displayName.trim();
  if (!trimmedName) {
    throw new ApiError(400, "VALIDATION_ERROR", "Display name is required");
  }

  const { data: signUpData, error: signUpError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: trimmedName,
      },
    });

  if (signUpError) {
    throw new ApiError(400, "REGISTRATION_FAILED", signUpError.message);
  }

  if (!signUpData.user) {
    throw new ApiError(400, "REGISTRATION_FAILED", "Unable to create account");
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError || !signInData.session) {
    throw new ApiError(
      400,
      "REGISTRATION_FAILED",
      signInError?.message ?? "Account created but sign in failed"
    );
  }

  const profile = await findProfileById(signInData.user.id);

  return {
    session: signInData.session,
    user: mapProfile(profile, signInData.user.email ?? email),
  };
}

export async function loginMember({ email, password }) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const profile = await findProfileById(data.user.id);

  return {
    session: data.session,
    user: mapProfile(profile, data.user.email ?? email),
  };
}

export async function getMeFromRequest(req) {
  const accessToken = getAccessToken(req);
  return getCurrentUser(accessToken);
}
