import { createClient } from "@supabase/supabase-js";
import env from "./env.js";

const hasValidSupabaseConfig =
  Boolean(env.supabaseUrl?.match(/^https?:\/\//i)) &&
  Boolean(env.supabaseServiceRoleKey);

const supabase = hasValidSupabaseConfig
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
  : null;

export default supabase;
