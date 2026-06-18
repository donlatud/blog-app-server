import ApiError from "../utils/apiError.js";
import env from "../config/env.js";

export default function errorHandler(err, req, res, next) {
  const statusCode =
    err instanceof ApiError
      ? err.statusCode
      : err?.code === "LIMIT_FILE_SIZE"
        ? 400
        : err.statusCode || 500;
  const code =
    err instanceof ApiError
      ? err.code
      : err?.code === "LIMIT_FILE_SIZE"
        ? "VALIDATION_ERROR"
        : err.code || "INTERNAL_SERVER_ERROR";
  let message =
    err instanceof ApiError
      ? err.message
      : err?.code === "LIMIT_FILE_SIZE"
        ? "Image must be smaller than 5 MB."
        : err.message || "Internal server error";

  if (statusCode >= 500 && env.isProduction && !(err instanceof ApiError)) {
    message = "Internal server error";
  }

  if (!env.isProduction) {
    console.error(err);
  }

  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: { code: "CORS_FORBIDDEN", message: "Origin not allowed" },
    });
  }

  res.status(statusCode).json({
    error: { code, message },
  });
}
