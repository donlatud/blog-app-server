import { PAGINATION } from "../constants/index.js";

export function getPaginationParams(query) {
  const page = Math.max(Number(query.page) || PAGINATION.DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(Number(query.limit) || PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
