export const THAI_NUMBER_COMMENT_REGEX = /^[\u0E00-\u0E7F0-9\s]+$/;

export const COMMENT_BODY_MIN = 1;
export const COMMENT_BODY_MAX = 500;

export function validateCommentBody(body) {
  if (typeof body !== "string") {
    return "Comment is required.";
  }

  const trimmed = body.trim();

  if (trimmed.length < COMMENT_BODY_MIN) {
    return "Comment cannot be empty.";
  }

  if (trimmed.length > COMMENT_BODY_MAX) {
    return `Comment must be at most ${COMMENT_BODY_MAX} characters.`;
  }

  if (!THAI_NUMBER_COMMENT_REGEX.test(trimmed)) {
    return "Comments may only contain Thai characters and numbers.";
  }

  return null;
}
