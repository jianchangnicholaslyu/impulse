# IMPULSE Supabase Setup

IMPULSE uses Supabase as a persistent backend store when these Vercel environment variables are configured:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STATE_TABLE`

The service role key must stay server-side only. Do not put it in frontend code, `.env.example`, screenshots, issues, or commits.

## 1. Create The Table

Open Supabase Dashboard -> SQL Editor, then run:

```sql
-- See database/supabase.sql
```

Use the full SQL in `database/supabase.sql`.

## 2. Set Vercel Environment Variables

In Vercel Project -> Settings -> Environment Variables, add:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SIDE_SERVICE_ROLE_KEY
SUPABASE_STATE_TABLE=impulse_state
BACKEND_SECRET=YOUR_LONG_RANDOM_SECRET
```

Set them for Production, Preview, and Development if you want all environments to share the same persistent database.

## 3. Redeploy

After saving the environment variables, redeploy the latest Vercel deployment.

## 4. Verify

Run:

```bash
curl -sS -X POST https://impulse.ccwu.cc/api/backend \
  -H 'Content-Type: application/json' \
  -d '{"action":"health"}'
```

Expected:

```json
{"ok":true,"storage":"supabase","hasEmail":false}
```

`hasEmail` becomes `true` after configuring `RESEND_API_KEY` and `MAIL_FROM`.
