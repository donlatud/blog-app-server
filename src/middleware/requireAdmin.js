import { USER_ROLE } from "../constants/index.js";
import { getMeFromRequest } from "../services/authService.js";
import ApiError from "../utils/apiError.js";

export async function requireAdmin(req, res, next) {
  try {
    const user = await getMeFromRequest(req, res);
    req.authUser = user;

    if (user.role !== USER_ROLE.ADMIN) {
      throw new ApiError(403, "FORBIDDEN", "Admin access required");
    }

    next();
  } catch (error) {
    next(error);
  }
}
