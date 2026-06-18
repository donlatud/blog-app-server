-- ============================================================
-- Blog App — Full Database Schema (Supabase SQL Editor)
-- รันไฟล์นี้ทั้งก้อนใน Supabase → SQL Editor → Run
--
-- ถ้าเคยรัน SQL ชุดเก่า (ไม่มี profiles/user_id) แล้ว error:
--   1) รัน supabase/reset.sql ก่อน  (ลบข้อมูล dev ทั้งหมด)
--   2) รันไฟล์นี้อีกครั้ง
-- ============================================================

-- (optional) fuzzy search ชื่อ blog
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1) profiles — ข้อมูล user (ผูกกับ auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'member'
               CHECK (role IN ('member', 'admin')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx
  ON public.profiles (role);

-- ============================================================
-- 2) blogs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blogs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  excerpt         TEXT,
  content         TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'published')),
  view_count      INTEGER NOT NULL DEFAULT 0
                  CHECK (view_count >= 0),
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS blogs_slug_unique_idx
  ON public.blogs (slug);

CREATE INDEX IF NOT EXISTS blogs_status_published_at_idx
  ON public.blogs (status, published_at DESC);

CREATE INDEX IF NOT EXISTS blogs_title_idx
  ON public.blogs (title);

-- ============================================================
-- 3) blog_images (รูปเพิ่มเติม สูงสุด 6 รูป/blog)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id    UUID NOT NULL
             REFERENCES public.blogs(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  position   INTEGER NOT NULL
             CHECK (position >= 1 AND position <= 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blog_id, position)
);

CREATE INDEX IF NOT EXISTS blog_images_blog_id_idx
  ON public.blog_images (blog_id);

-- ============================================================
-- 4) comments — สร้างตารางพื้นฐาน แล้ว migrate เพิ่ม user_id ถ้าขาด
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id      UUID NOT NULL
               REFERENCES public.blogs(id) ON DELETE CASCADE,
  author_name  TEXT NOT NULL,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at  TIMESTAMPTZ
);

-- เพิ่ม user_id ถ้าตารางเก่ายังไม่มีคอลัมน์นี้ (จาก SQL ชุดแรก)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'comments'
      AND column_name = 'user_id'
  ) THEN
    -- ลบ comment เก่าที่ไม่มี user (dev data) ก่อนเพิ่ม NOT NULL
    DELETE FROM public.comments;

    ALTER TABLE public.comments
      ADD COLUMN user_id UUID NOT NULL
      REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS comments_blog_id_status_idx
  ON public.comments (blog_id, status);

CREATE INDEX IF NOT EXISTS comments_user_id_idx
  ON public.comments (user_id);

CREATE INDEX IF NOT EXISTS comments_status_created_at_idx
  ON public.comments (status, created_at DESC);

-- ============================================================
-- 5) Triggers — updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS blogs_set_updated_at ON public.blogs;
CREATE TRIGGER blogs_set_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6) Trigger — สร้าง profile อัตโนมัติเมื่อ user สมัคร (auth.users)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'member')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7) Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public can read published blogs" ON public.blogs;
CREATE POLICY "Public can read published blogs"
ON public.blogs
FOR SELECT
TO anon, authenticated
USING (status = 'published');

DROP POLICY IF EXISTS "Public can read images of published blogs" ON public.blog_images;
CREATE POLICY "Public can read images of published blogs"
ON public.blog_images
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.blogs b
    WHERE b.id = blog_images.blog_id
      AND b.status = 'published'
  )
);

DROP POLICY IF EXISTS "Public can read approved comments" ON public.comments;
CREATE POLICY "Public can read approved comments"
ON public.comments
FOR SELECT
TO anon, authenticated
USING (
  status = 'approved'
  AND EXISTS (
    SELECT 1 FROM public.blogs b
    WHERE b.id = comments.blog_id
      AND b.status = 'published'
  )
);

DROP POLICY IF EXISTS "Authenticated users can insert own comments" ON public.comments;
CREATE POLICY "Authenticated users can insert own comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own comments" ON public.comments;
CREATE POLICY "Users can read own comments"
ON public.comments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- 8) Storage bucket สำหรับรูป blog
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
CREATE POLICY "Public read blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Service role upload blog images" ON storage.objects;
CREATE POLICY "Service role upload blog images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images'
  AND COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
);

DROP POLICY IF EXISTS "Service role update blog images" ON storage.objects;
CREATE POLICY "Service role update blog images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'blog-images'
  AND COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
)
WITH CHECK (
  bucket_id = 'blog-images'
  AND COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
);

DROP POLICY IF EXISTS "Service role delete blog images" ON storage.objects;
CREATE POLICY "Service role delete blog images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'blog-images'
  AND COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
);

-- ============================================================
-- 9) ตั้ง admin หลังสร้าง user ใน Authentication → Users
-- ============================================================
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = '<USER_UUID_FROM_AUTH_USERS>';
