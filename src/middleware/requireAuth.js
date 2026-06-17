import { getMeFromRequest } from "../services/authService.js";
import ApiError from "../utils/apiError.js";
import { getAccessToken } from "../utils/authCookies.js";

export async function requireAuth(req, res, next) {
  try {
    const accessToken = getAccessToken(req);

    if (!accessToken) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    const user = await getMeFromRequest(req);
    req.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
}
