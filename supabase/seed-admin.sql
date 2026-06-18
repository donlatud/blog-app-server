-- Feature 5: Promote an existing user to admin (run after creating user in Supabase Auth)
--
-- 1. Supabase Dashboard → Authentication → Users → Add user
--    email: admin@example.com  password: (your choice)
-- 2. Run this SQL:

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE email = 'admin@gmail.com'
  LIMIT 1
);

-- Verify:
-- SELECT p.id, p.display_name, p.role, u.email
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.id
-- WHERE p.role = 'admin';
