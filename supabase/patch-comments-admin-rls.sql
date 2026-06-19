-- Restore comments RLS + admin moderation access (Supabase SQL Editor)
-- Fixes: comment submitted but admin "Pending" tab is empty
--        or approve/reject returns COMMENT_NOT_FOUND
--
-- Backend must use SUPABASE_SERVICE_ROLE_KEY (service_role, not anon).

-- ============================================================
-- Public / member policies (from schema.sql)
-- ============================================================
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
-- Backend policies (Express API — list pending, approve, reject)
-- ============================================================
DROP POLICY IF EXISTS "Backend read all comments" ON public.comments;
DROP POLICY IF EXISTS "Backend insert comments" ON public.comments;
DROP POLICY IF EXISTS "Backend update comments" ON public.comments;

CREATE POLICY "Backend read all comments"
ON public.comments
FOR SELECT
USING (true);

CREATE POLICY "Backend insert comments"
ON public.comments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Backend update comments"
ON public.comments
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Verify pending comments exist:
-- SELECT id, author_name, body, status, created_at
-- FROM public.comments
-- ORDER BY created_at DESC;
