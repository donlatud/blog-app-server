import {
  getMeFromRequest,
  loginMember,
  registerMember,
} from "../services/authService.js";
import {
  clearAuthCookies,
  getAccessToken,
  setAuthCookies,
} from "../utils/authCookies.js";
import ApiError from "../utils/apiError.js";

function validateEmailPassword(body) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    throw new ApiError(400, "VALIDATION_ERROR", "Email and password are required");
  }

  if (password.length < 6) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Password must be at least 6 characters"
    );
  }

  return { email, password };
}

export async function register(req, res, next) {
  try {
    const { email, password } = validateEmailPassword(req.body);
    const displayName =
      typeof req.body.display_name === "string"
        ? req.body.display_name
        : typeof req.body.displayName === "string"
          ? req.body.displayName
          : "";

    const result = await registerMember({
      email,
      password,
      displayName,
    });

    setAuthCookies(res, result.session);

    return res.status(201).json({ data: result.user });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = validateEmailPassword(req.body);
    const result = await loginMember({ email, password });

    setAuthCookies(res, result.session);

    return res.status(200).json({ data: result.user });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    clearAuthCookies(res);
    return res.status(200).json({ data: { success: true } });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await getMeFromRequest(req);
    return res.status(200).json({ data: user });
  } catch (error) {
    return next(error);
  }
}

export { getAccessToken };
