# Blog App Server

Express API สำหรับระบบ Blog — Supabase (Postgres + Auth + Storage)

## Getting Started

```bash
cp .env.example .env
npm install
npm run dev
```

API รันที่ [http://localhost:4000](http://localhost:4000) — ทดสอบ health: `GET /api/health`

## Database

1. รัน `supabase/schema.sql` ใน Supabase SQL Editor
2. รัน `supabase/seed.sql` — seed blog 11 published + 1 draft สำหรับทดสอบ Feature 1

## Feature 1 API

```
GET /api/blogs?search=&page=1&limit=10
```

- เฉพาะ `status = published`
- ค้นหาจาก `title` (ILIKE)
- Response: `{ data: BlogListItem[], meta: { page, limit, total, totalPages } }`

## Feature 2 API

```
GET  /api/blogs/:slug
POST /api/blogs/:slug/view
```

- รายละเอียด blog (published) + `blog_images`
- `POST /view` เพิ่ม view count ทุกครั้งที่เปิดหน้า
- รัน `supabase/seed-blog-images.sql` สำหรับเนื้อหา + รูปเพิ่มเติมตัวอย่าง

## Feature 3 API

```
POST /api/auth/register   { email, password, displayName }
POST /api/auth/login      { email, password }
POST /api/auth/logout
GET  /api/auth/me
```

- Session via httpOnly cookies (`access_token`, `refresh_token`)
- Frontend must use `withCredentials: true` on API requests

## Feature 4 API

```
GET  /api/blogs/:slug          # includes approved comments only
POST /api/blogs/:slug/comments { body }   # requireAuth — status pending
```

- Comment body: Thai characters and numbers only (1–500 chars), validated client + server
- Run `supabase/patch-comment-rls.sql` if upgrading an older database
- Run `supabase/seed-comments.sql` for 2 approved demo comments on `beginner-guide`

## Feature 5 API

```
GET /api/admin/blogs?page=1&limit=10&status=all|published|draft
```

- Requires admin session (`profiles.role = 'admin'`)
- Member/non-admin → `403 FORBIDDEN`
- Run `supabase/seed-admin.sql` after creating admin user in Supabase Auth
