# IMPULSE J Supabase Setup

IMPULSE J uses Supabase as a persistent backend store when these Vercel environment variables are configured:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STATE_TABLE`
- `SUPABASE_STORAGE_BUCKET`
- `RESEND_API_KEY`
- `RESEND_FROM_AUTH`
- `RESEND_FROM_NOTIFY`
- `RESEND_FROM_SUPPORT`

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
SUPABASE_STORAGE_BUCKET=impulse-assets
BACKEND_SECRET=YOUR_LONG_RANDOM_SECRET
RESEND_API_KEY=YOUR_RESEND_SERVER_SIDE_KEY
RESEND_FROM_AUTH=IMPULSE J Auth <auth@auth.impulse.ccwu.cc>
RESEND_FROM_NOTIFY=IMPULSE J Notify <notify@auth.impulse.ccwu.cc>
RESEND_FROM_SUPPORT=IMPULSE J Support <support@auth.impulse.ccwu.cc>
```

Set them for Production, Preview, and Development if you want all environments to share the same persistent database.

## 3. Enable Asset Storage

For admin display-image uploads, open Supabase Dashboard -> SQL Editor and run:

```sql
-- See database/storage-bucket.sql
```

Use the full SQL in `database/storage-bucket.sql`. It creates a public `impulse-assets` bucket with a 5MB server-side image limit.

## 4. Redeploy

After saving the environment variables, redeploy the latest Vercel deployment.

## 5. Verify

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

`hasEmail` becomes `true` after configuring `RESEND_API_KEY`, `RESEND_FROM_AUTH`, `RESEND_FROM_NOTIFY`, and `RESEND_FROM_SUPPORT`.

Email audit data is currently persisted inside the JSON state for compatibility. The future normalized table script is in `database/email-service.sql`.
