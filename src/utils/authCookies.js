const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

const REFRESH_COOKIE_MAX_AGE_MS = 60 * 60 * 24 * 30 * 1000;

const isProduction = process.env.NODE_ENV === "production";

function buildLocalCookieOptions() {
  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  };
}

function buildCrossOriginCookieOptions({ partitioned = false } = {}) {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };

  if (partitioned) {
    options.partitioned = true;
  }

  return options;
}

function getSetCookieOptions() {
  if (!isProduction) {
    return buildLocalCookieOptions();
  }

  return buildCrossOriginCookieOptions({ partitioned: true });
}

function getClearCookieOptionVariants() {
  if (!isProduction) {
    return [buildLocalCookieOptions()];
  }

  // Cross-origin (Vercel) may leave older cookies without Partitioned;
  // clear every variant so logout works reliably in production.
  return [
    buildCrossOriginCookieOptions({ partitioned: true }),
    buildCrossOriginCookieOptions({ partitioned: false }),
  ];
}

function formatSameSite(value) {
  if (value === "none") {
    return "None";
  }

  if (value === "strict") {
    return "Strict";
  }

  return "Lax";
}

function serializeSetCookie(name, value, options) {
  const segments = [`${name}=${value}`, `Path=${options.path ?? "/"}`, "HttpOnly"];

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires instanceof Date) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.secure) {
    segments.push("Secure");
  }

  if (options.sameSite) {
    segments.push(`SameSite=${formatSameSite(options.sameSite)}`);
  }

  if (options.partitioned) {
    segments.push("Partitioned");
  }

  return segments.join("; ");
}

export function setAuthCookies(res, session) {
  const cookieOptions = {
    ...getSetCookieOptions(),
    maxAge: Math.floor(REFRESH_COOKIE_MAX_AGE_MS / 1000),
  };

  const headers = [
    serializeSetCookie(ACCESS_TOKEN_COOKIE, session.access_token, cookieOptions),
  ];

  if (session.refresh_token) {
    headers.push(
      serializeSetCookie(
        REFRESH_TOKEN_COOKIE,
        session.refresh_token,
        cookieOptions
      )
    );
  }

  res.setHeader("Set-Cookie", headers);
}

export function clearAuthCookies(res) {
  const expired = {
    maxAge: 0,
    expires: new Date(0),
  };

  const headers = [];

  for (const options of getClearCookieOptionVariants()) {
    for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) {
      headers.push(serializeSetCookie(name, "", { ...options, ...expired }));
    }
  }

  res.setHeader("Set-Cookie", headers);
}

export function getAccessToken(req) {
  return req.cookies?.[ACCESS_TOKEN_COOKIE] ?? null;
}

export function getRefreshToken(req) {
  return req.cookies?.[REFRESH_TOKEN_COOKIE] ?? null;
}
