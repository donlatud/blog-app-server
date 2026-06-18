import dotenv from "dotenv";

dotenv.config();

const parseClientUrls = (value) =>
  (value || "http://localhost:3000")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

const clientUrls = parseClientUrls(process.env.CLIENT_URL);

const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  clientUrl: clientUrls[0] || "http://localhost:3000",
  clientUrls,
  isProduction: process.env.NODE_ENV === "production",
};

export default env;
