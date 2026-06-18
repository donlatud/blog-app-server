-- ============================================================
-- Blog App — Seed blog_images สำหรับ Feature 2 (หน้ารายละเอียด)
-- รันใน Supabase SQL Editor หลัง seed.sql
-- ============================================================

UPDATE public.blogs
SET content = 'การเขียนบล็อกภาษาไทยเริ่มจากการเลือกหัวข้อที่ใกล้ตัวและมีประโยชน์กับผู้อ่าน เมื่อมีหัวข้อแล้ว ลองร่างโครงสร้างบทความเป็นหัวข้อย่อย ๆ ก่อนลงมือเขียนเนื้อหาเต็ม

ย่อหน้าถัดไปควรสั้น กระชับ และอ่านง่าย ใช้ประโยคที่ตรงประเด็น หลีกเลี่ยงการยืดเยื้อเกินจำเป็น การแบ่งย่อหน้าช่วยให้ผู้อ่านไม่รู้สึกหนักเกินไป

สุดท้าย อย่าลืมตรวจสอบตัวสะกดและความถูกต้องของข้อมูลก่อนเผยแพร่ การอ่านซ้ำหนึ่งรอบช่วยให้บทความดูเป็นมืออาชีพมากขึ้น'
WHERE slug = 'beginner-guide';

INSERT INTO public.blog_images (blog_id, image_url, position)
SELECT b.id, v.image_url, v.position
FROM public.blogs b
CROSS JOIN (
  VALUES
    ('https://images.unsplash.com/photo-1515378791031-14dd8d6297ac?w=640&h=480&fit=crop', 1),
    ('https://images.unsplash.com/photo-1455390582260-0446dee2a3fa?w=640&h=480&fit=crop', 2),
    ('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=640&h=480&fit=crop', 3),
    ('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=640&h=480&fit=crop', 4)
) AS v(image_url, position)
WHERE b.slug = 'beginner-guide'
ON CONFLICT (blog_id, position) DO NOTHING;
