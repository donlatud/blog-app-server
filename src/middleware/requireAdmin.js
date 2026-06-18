import { USER_ROLE } from "../constants/index.js";
import { getMeFromRequest } from "../services/authService.js";
import ApiError from "../utils/apiError.js";
import { getAccessToken } from "../utils/authCookies.js";

export async function requireAdmin(req, res, next) {
  try {
    const accessToken = getAccessToken(req);

    if (!accessToken) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    const user = await getMeFromRequest(req);
    req.authUser = user;

    if (user.role !== USER_ROLE.ADMIN) {
      throw new ApiError(403, "FORBIDDEN", "Admin access required");
    }

    next();
  } catch (error) {
    next(error);
  }
}
