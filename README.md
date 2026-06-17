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
