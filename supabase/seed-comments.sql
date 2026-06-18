-- Seed approved comments for beginner-guide (Feature 4 UI demo)
-- Safe to re-run: removes prior seeded rows for this blog first.

DELETE FROM public.comments
WHERE blog_id = (SELECT id FROM public.blogs WHERE slug = 'beginner-guide' LIMIT 1)
  AND body IN (
    'บทความนี้มีประโยชน์มากครับ อ่านแล้วเข้าใจง่ายมาก',
    'ขอบคุณสำหรับคำแนะนำดีๆ จะนำไปปรับใช้กับบล็อกของตัวเองครับ'
  );

INSERT INTO public.comments (blog_id, user_id, author_name, body, status)
SELECT
  b.id,
  p.id,
  p.display_name,
  c.body,
  'approved'
FROM public.blogs b
CROSS JOIN (
  VALUES
    ('บทความนี้มีประโยชน์มากครับ อ่านแล้วเข้าใจง่ายมาก'),
    ('ขอบคุณสำหรับคำแนะนำดีๆ จะนำไปปรับใช้กับบล็อกของตัวเองครับ')
) AS c(body)
JOIN LATERAL (
  SELECT id, display_name
  FROM public.profiles
  WHERE role = 'member'
  ORDER BY created_at ASC
  LIMIT 1
) p ON true
WHERE b.slug = 'beginner-guide';
