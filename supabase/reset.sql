-- ============================================================
-- RESET (dev only) — รันก่อน schema.sql
-- ลบข้อมูลทั้งหมดในตาราง blog (ปลอดภัยแม้บางตารางยังไม่เคยสร้าง)
-- ============================================================

-- trigger บน auth.users (ไม่ต้องมีตาราง profiles)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ลบตารางก่อน (CASCADE ลบ policy + trigger บนตารางนั้นให้เอง)
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.blog_images CASCADE;
DROP TABLE IF EXISTS public.blogs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ลบ functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.set_updated_at();

-- storage policy (ตาราง storage.objects มีอยู่เสมอใน Supabase)
DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
