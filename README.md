# S.T.E.P.S. - Weekly Bible Study Platform

Interactive weekly Bible study app built around **Scripture → Theme → Engagement → Prayer → Share**.

Stack: **Next.js (App Router) + Supabase (Auth/Postgres/RLS) + Resend + Vercel Cron**.

## Features

- Email/password auth with RBAC (`USER` / `ADMIN`)
- Admin-only weekly publishing (atomic RPC: week + 2 questions)
- Nested threaded chat under each engagement question
- Custom reactions: ❤️ Heart · 🙏 Prayer · 🤔 Thinking (WCAG-friendly)
- Prayer requests with anonymous toggle + admin moderation
- Weekly reminder email: *“Get your S.T.E.P.S. in this week”*
- RLS on every table, `robots.txt` + `noindex`, one-click unsubscribe

## Quick start

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run [`supabase/schema.sql`](./supabase/schema.sql)
3. Copy **Project URL**, **anon key**, and **service role key**

### 2. Configure env

```bash
cp .env.example .env.local
```

Fill in Supabase, Resend, `CRON_SECRET`, and `NEXT_PUBLIC_APP_URL`.

### 3. Install & run

Requires **Node.js 20.9+** (22 recommended).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Auth settings (local / small community)

In Supabase → **Authentication → Providers → Email**, you can disable “Confirm email” so invitees can sign in immediately after signup.

### 5. Promote the admin (“Dad”)

Sign up once, then in Supabase SQL Editor:

```sql
update public.users
set role = 'ADMIN'
where email = 'your-admin@email.com';
```

See also [`supabase/seed-admin.sql`](./supabase/seed-admin.sql).

### 6. Deploy

1. Push to GitHub and import on [Vercel](https://vercel.com)
2. Add the same env vars in Vercel
3. `vercel.json` schedules Monday 08:00 UTC → `/api/cron/weekly-reminder`
4. Set `CRON_SECRET` in Vercel (Authorization bearer for the cron route)
5. Configure Resend domain (SPF / DKIM / DMARC) and set `RESEND_FROM_EMAIL`
6. Optional: Resend webhook → `/api/webhooks/resend` for bounce suppression

## App routes

| Route | Purpose |
|-------|---------|
| `/login`, `/signup` | Auth |
| `/steps` | Current week (linear S.T.E.P.S.) |
| `/weeks` | Archive |
| `/weeks/[id]` | Past week |
| `/admin/create` | Admin publish form |
| `/admin/moderate` | Prayer moderation |
| `/profile` | Display name + email opt-in |

## Security notes

- Frontend hides admin UI; **RLS** enforces ADMIN writes on `weekly_steps`
- Comments/reactions/prayers: authors manage their own rows
- Cron route requires `Authorization: Bearer $CRON_SECRET`
- Authenticated pages send `noindex`; `robots.txt` disallows all crawlers

## Project layout

```
src/app/           # Routes + API
src/components/    # UI (threads, reactions, prayer, admin)
src/lib/           # Supabase clients, actions, data helpers
src/emails/        # React Email templates
supabase/          # Schema + admin seed SQL
```
