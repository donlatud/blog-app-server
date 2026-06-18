# Blog App Server

Express REST API for the Blog System — Supabase (Postgres + Auth + Storage).

## Prerequisites

- Node.js 20+
- Supabase project

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

API runs at [http://localhost:4000](http://localhost:4000) — health check: `GET /api/health`

| Variable | Description |
|---|---|
| `PORT` | Server port (default `4000`) |
| `NODE_ENV` | `development` or `production` |
| `SUPABASE_URL` | Project URL — `https://xxxxx.supabase.co` (not the Postgres connection string) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only — never expose to frontend) |
| `CLIENT_URL` | Frontend origin(s) for CORS — comma-separated for multiple URLs |

## Database setup

Run these SQL files in the Supabase SQL Editor **in order**:

| # | File | Purpose |
|---|---|---|
| 1 | `supabase/schema.sql` | Tables, RLS, storage bucket |
| 2 | `supabase/seed.sql` | 11 published + 1 draft blog |
| 3 | `supabase/seed-blog-images.sql` | Sample content + gallery images |
| 4 | `supabase/seed-comments.sql` | Demo approved comments |
| 5 | `supabase/patch-comment-rls.sql` | Only if upgrading an older database |
| 6 | `supabase/patch-storage-rls.sql` | If admin image upload fails with RLS error |

### Admin user

1. Create a user in Supabase Dashboard → **Authentication** → **Users**
2. Run `supabase/seed-admin.sql` (replace the UUID with your admin user id)

### Member demo user

Register via `POST /api/auth/register` or use the frontend `/register` page.

## API overview

### Public

```
GET  /api/health
GET  /api/blogs?search=&page=1&limit=10
GET  /api/blogs/:slug
POST /api/blogs/:slug/view
POST /api/blogs/:slug/comments        # requireAuth — status: pending
```

### Auth

```
POST /api/auth/register   { email, password, displayName }
POST /api/auth/login      { email, password }
POST /api/auth/logout
GET  /api/auth/me
```

Session via **httpOnly cookies** (`access_token`, `refresh_token`). Frontend must send `withCredentials: true`.

### Admin (requires `profiles.role = 'admin'`)

```
GET    /api/admin/blogs?status=all|published|draft
POST   /api/admin/blogs
GET    /api/admin/blogs/:id
PUT    /api/admin/blogs/:id
PATCH  /api/admin/blogs/:id/status    { status: "draft" | "published" }
DELETE /api/admin/blogs/:id
POST   /api/admin/uploads             multipart field: file

GET    /api/admin/comments?status=pending|approved|rejected|all
GET    /api/admin/comments/pending-count
PATCH  /api/admin/comments/:id/status { status: "pending" | "approved" | "rejected" }
```

All error responses: `{ error: { code, message } }`

## Deploy to Vercel

1. Push this repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `CLIENT_URL` | Frontend URL(s) — e.g. `https://your-frontend.vercel.app` |
| `NODE_ENV` | `production` |

4. Deploy — `vercel.json` is included for serverless Express

`VERCEL=1` is set automatically on Vercel; the app exports the Express handler instead of calling `listen()`.

### CORS in production

Set `CLIENT_URL` to your deployed frontend URL. For multiple origins (e.g. production + preview):

```
CLIENT_URL=https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

## Supabase Auth redirect URLs

In Supabase Dashboard → **Authentication** → **URL configuration**:

| Setting | Value |
|---|---|
| Site URL | Your frontend URL |
| Redirect URLs | `http://localhost:3000/**`, `https://your-frontend.vercel.app/**` |

## Storage

Admin image uploads go to the `blog-images` bucket (created by `schema.sql`). Max file size: 5 MB.

If upload returns `UPLOAD_ERROR` / `row-level security`:

1. Confirm `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key (not anon)
2. Run `supabase/patch-storage-rls.sql` in Supabase SQL Editor
3. Redeploy backend

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (local) |
| `npm run start:prod` | Start without nodemon (production) |
