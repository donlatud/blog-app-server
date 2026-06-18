import createApp from "./app.js";
import env from "./config/env.js";
import supabase from "./config/supabase.js";

const app = createApp();

if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
    if (!supabase) {
      console.warn(
        "[blog-app-server] Supabase ไม่พร้อม — ตรวจ SUPABASE_URL (https://xxx.supabase.co) และ SUPABASE_SERVICE_ROLE_KEY ใน .env แล้ว restart server"
      );
    }
  });
}

export default app;
