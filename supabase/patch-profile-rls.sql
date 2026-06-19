-- Restore profiles RLS (run in Supabase SQL Editor)
-- Fixes: "new row violates row-level security policy for table profiles"
--        or admin dashboard "Profile not found"
--
-- Backend must use SUPABASE_SERVICE_ROLE_KEY (service_role, not anon).

-- ============================================================
-- User-facing policies (from schema.sql)
-- ============================================================
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

-- ============================================================
-- Backend policies (Express API — create/read/update profiles)
-- ============================================================
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

-- ============================================================
-- Recreate admin profile if missing (change email if needed)
-- ============================================================
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
