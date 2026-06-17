const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

const isProduction = process.env.NODE_ENV === "production";

export function setAuthCookies(res, session) {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: session.expires_in * 1000,
  };

  res.cookie(ACCESS_TOKEN_COOKIE, session.access_token, cookieOptions);

  if (session.refresh_token) {
    res.cookie(REFRESH_TOKEN_COOKIE, session.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30 * 1000,
    });
  }
}

export function clearAuthCookies(res) {
  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  res.clearCookie(ACCESS_TOKEN_COOKIE, clearOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, clearOptions);
}

export function getAccessToken(req) {
  return req.cookies?.[ACCESS_TOKEN_COOKIE] ?? null;
}
