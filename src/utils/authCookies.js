const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

const REFRESH_COOKIE_MAX_AGE_MS = 60 * 60 * 24 * 30 * 1000;

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export function setAuthCookies(res, session) {
  res.cookie(ACCESS_TOKEN_COOKIE, session.access_token, {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });

  if (session.refresh_token) {
    res.cookie(REFRESH_TOKEN_COOKIE, session.refresh_token, {
      ...baseCookieOptions,
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions);
}

export function getAccessToken(req) {
  return req.cookies?.[ACCESS_TOKEN_COOKIE] ?? null;
}

export function getRefreshToken(req) {
  return req.cookies?.[REFRESH_TOKEN_COOKIE] ?? null;
}
