import { getMeFromRequest } from "../services/authService.js";

export async function requireAuth(req, res, next) {
  try {
    const user = await getMeFromRequest(req, res);
    req.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
}
