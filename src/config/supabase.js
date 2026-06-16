import { createClient } from "@supabase/supabase-js";
import env from "./env.js";

const supabase =
  env.supabaseUrl && env.supabaseServiceRoleKey
    ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
    : null;

export default supabase;
