function normalizeOrigin(origin) {
  return origin.replace(/\/+$/, "");
}

function getHostname(origin) {
  return new URL(origin).hostname;
}

function getVercelProjectKey(hostname) {
  const subdomain = hostname.replace(/\.vercel\.app$/i, "").split("-git-")[0];
  const parts = subdomain.split("-");

  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }

  return parts[0] ?? "";
}

function isSameVercelProject(originHost, allowedHost) {
  if (
    !originHost.endsWith(".vercel.app") ||
    !allowedHost.endsWith(".vercel.app")
  ) {
    return false;
  }

  const originKey = getVercelProjectKey(originHost);
  const allowedKey = getVercelProjectKey(allowedHost);

  if (!originKey || !allowedKey) {
    return false;
  }

  return (
    originKey === allowedKey ||
    originHost.startsWith(`${allowedKey}-`) ||
    originHost.startsWith(`${allowedKey}-git-`) ||
    allowedHost.startsWith(`${originKey}-`)
  );
}

function isVercelDeploymentFallback(originHost, clientUrls, corsVercelPrefixes) {
  if (process.env.VERCEL !== "1") {
    return false;
  }

  if (!originHost.endsWith(".vercel.app")) {
    return false;
  }

  const hasConfiguredVercelClient = clientUrls.some((url) => {
    try {
      return getHostname(url).endsWith(".vercel.app");
    } catch {
      return false;
    }
  });

  if (hasConfiguredVercelClient) {
    return false;
  }

  return corsVercelPrefixes.some((prefix) => originHost.startsWith(prefix));
}

export function isAllowedClientOrigin(origin, clientUrls, corsVercelPrefixes = []) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  for (const clientUrl of clientUrls) {
    const normalizedClientUrl = normalizeOrigin(clientUrl);

    if (normalizedOrigin === normalizedClientUrl) {
      return true;
    }

    try {
      const originHost = getHostname(normalizedOrigin);
      const allowedHost = getHostname(normalizedClientUrl);

      if (isSameVercelProject(originHost, allowedHost)) {
        return true;
      }
    } catch {
      // Ignore invalid URL values in CLIENT_URL.
    }
  }

  try {
    const originHost = getHostname(normalizedOrigin);
    if (isVercelDeploymentFallback(originHost, clientUrls, corsVercelPrefixes)) {
      return true;
    }
  } catch {
    // Ignore invalid origin.
  }

  return false;
}
