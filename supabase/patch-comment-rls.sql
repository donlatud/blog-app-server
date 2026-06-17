-- Run once if schema.sql was applied before Feature 4 comment RLS fix
-- Allows members to read their own pending comments after insert (RETURNING)

DROP POLICY IF EXISTS "Users can read own comments" ON public.comments;
CREATE POLICY "Users can read own comments"
ON public.comments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
