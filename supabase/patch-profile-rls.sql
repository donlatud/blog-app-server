-- Run if admin dashboard shows "Profile not found"
-- or after resetting blog data while auth users still exist.
--
-- Backend must use SUPABASE_SERVICE_ROLE_KEY (service_role, not anon).

DROP POLICY IF EXISTS "Backend read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Backend insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Backend update profiles" ON public.profiles;

CREATE POLICY "Backend read profiles"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Backend insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Backend update profiles"
ON public.profiles
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Recreate missing admin profile after data reset (change email if needed)
INSERT INTO public.profiles (id, display_name, role)
SELECT
  u.id,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'display_name'), ''),
    split_part(u.email, '@', 1)
  ),
  'admin'
FROM auth.users u
WHERE u.email = 'admin@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
