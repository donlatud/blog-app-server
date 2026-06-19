import supabase from "../config/supabase.js";
import { ensureProfileForAuthUser } from "../repositories/profileRepository.js";
import ApiError from "../utils/apiError.js";
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
} from "../utils/authCookies.js";

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

async function isAccessTokenValid(accessToken) {
  if (!supabase || !accessToken) {
    return false;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  return !error && Boolean(user);
}

export async function refreshSessionFromToken(refreshToken) {
  if (!supabase) {
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Database is not configured"
    );
  }

  if (!refreshToken) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired session");
  }

  return data.session;
}

export async function resolveAccessToken(req, res) {
  const accessToken = getAccessToken(req);

  if (await isAccessTokenValid(accessToken)) {
    return accessToken;
  }

  const refreshToken = getRefreshToken(req);

  if (!refreshToken) {
    return null;
  }

  const session = await refreshSessionFromToken(refreshToken);
  setAuthCookies(res, session);

  return session.access_token;
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
  const profile = await ensureProfileForAuthUser(user);
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

  const profile = await ensureProfileForAuthUser(signInData.user);

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

  const profile = await ensureProfileForAuthUser(data.user);

  return {
    session: data.session,
    user: mapProfile(profile, data.user.email ?? email),
  };
}

export async function getMeFromRequest(req, res) {
  const accessToken = await resolveAccessToken(req, res);

  if (!accessToken) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  return getCurrentUser(accessToken);
}

export async function refreshAuthFromRequest(req, res) {
  const accessToken = await resolveAccessToken(req, res);

  if (!accessToken) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  return getCurrentUser(accessToken);
}

async function resolveUserIdForLogout(accessToken, refreshToken) {
  if (!supabase) {
    return null;
  }

  if (accessToken) {
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);

    if (user) {
      return user.id;
    }
  }

  if (!refreshToken) {
    return null;
  }

  try {
    const session = await refreshSessionFromToken(refreshToken);
    const {
      data: { user },
    } = await supabase.auth.getUser(session.access_token);

    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function logoutFromRequest(req, res) {
  const accessToken = getAccessToken(req);
  const refreshToken = getRefreshToken(req);
  const userId = await resolveUserIdForLogout(accessToken, refreshToken);

  if (supabase && userId) {
    await supabase.auth.admin.signOut(userId, "global");
  }

  clearAuthCookies(res);
}
