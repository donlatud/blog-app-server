-- Run once if admin image uploads fail with:
-- "new row violates row-level security policy"
--
-- Also verify backend env uses service_role key (Settings → API → service_role),
-- not the anon/public key.

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Service role upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Service role update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Service role delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Allow blog image uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow blog image updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow blog image deletes" ON storage.objects;

CREATE POLICY "Public read blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Backend uploads use service_role. These policies also cover edge cases
-- where storage RLS is evaluated for the blog-images bucket.
CREATE POLICY "Allow blog image uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Allow blog image updates"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'blog-images')
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Allow blog image deletes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'blog-images');
