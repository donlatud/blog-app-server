import dotenv from "dotenv";

dotenv.config();

const parseClientUrls = (...values) =>
  values
    .flatMap((value) => (value ? value.split(",") : []))
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const clientUrls = [
  ...new Set(
    parseClientUrls(process.env.CLIENT_URL, process.env.FRONTEND_URL)
  ),
];

const corsVercelPrefixes = parseClientUrls(process.env.CORS_VERCEL_PREFIXES || "blog-app")
  .map((value) => value.replace(/^https?:\/\//, "").replace(/\.vercel\.app$/, ""));

if (process.env.NODE_ENV === "production" && clientUrls.length > 0) {
  console.log(
    `[blog-app-server] CORS allowed origins: ${clientUrls.join(", ")} (+ matching *.vercel.app previews)`
  );
}

const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  clientUrl: clientUrls[0] || "http://localhost:3000",
  clientUrls,
  corsVercelPrefixes,
  isProduction: process.env.NODE_ENV === "production",
  isVercel: process.env.VERCEL === "1",
};

export default env;
