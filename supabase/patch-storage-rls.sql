-- Run once if admin image uploads fail with:
-- "new row violates row-level security policy"
--
-- Also verify backend env uses service_role key (Settings → API → service_role),
-- not the anon/public key.

DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Service role upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Service role update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Service role delete blog images" ON storage.objects;

CREATE POLICY "Public read blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

CREATE POLICY "Service role upload blog images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images'
  AND COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
);

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

CREATE POLICY "Service role delete blog images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'blog-images'
  AND COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
);
