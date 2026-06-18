-- Run if admin blog edit/save returns BLOG_NOT_FOUND or DATABASE_ERROR
-- (often caused by RLS blocking UPDATE/INSERT RETURNING on blogs/blog_images)
--
-- Backend must use SUPABASE_SERVICE_ROLE_KEY (service_role, not anon).

DROP POLICY IF EXISTS "Admin read all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admin insert blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admin update blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admin delete blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admin manage blog images" ON public.blog_images;

CREATE POLICY "Admin read all blogs"
ON public.blogs
FOR SELECT
USING (true);

CREATE POLICY "Admin insert blogs"
ON public.blogs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin update blogs"
ON public.blogs
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin delete blogs"
ON public.blogs
FOR DELETE
USING (true);

CREATE POLICY "Admin manage blog images"
ON public.blog_images
FOR ALL
USING (true)
WITH CHECK (true);
