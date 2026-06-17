import ApiError from "../utils/apiError.js";

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
  const message =
    err instanceof ApiError
      ? err.message
      : err?.code === "LIMIT_FILE_SIZE"
        ? "Image must be smaller than 5 MB."
        : err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    error: { code, message },
  });
}
