# IMPULSE Architecture

IMPULSE now uses a Vite entry point while preserving the existing vanilla HTML/CSS/JavaScript application surface.

## Current Runtime

- `index.html` is the browser entry.
- `src/main.js` imports the current application script and stylesheet for Vite builds.
- `src/legacy/app.js` contains the existing IMPULSE client application logic.
- `src/styles/main.css` contains the existing visual system and page styles.
- `api/backend.js` and `api/_backend-core.js` provide Vercel serverless APIs.
- `src/lib/email/index.js` provides the server-only Resend email module.
- `src/emails/` contains branded transactional email templates.
- `api/send-email.js` is an internal-only email bridge protected by `BACKEND_SECRET`.
- `api/auth/*` and `api/health/email.js` expose dedicated auth and email health endpoints.
- `database/supabase.sql` keeps the current JSON state table.

The root `app.js` and `styles.css` are kept as a local-file fallback. They should be synced from `src/legacy/app.js` and `src/styles/main.css` before release if the legacy fallback is still needed.

## Build Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

This workspace currently does not have a system `npm` executable in PATH, but Vercel will run the same scripts during deployment after installing dependencies.

## Migration Principles

- Do not delete existing user, order, ledger, chat, or log data during updates.
- Prefer additive schema and API changes.
- Keep localStorage and JSON state compatibility until the normalized database is proven in production.
- Preserve the IMPULSE visual identity unless a specific UI change is approved.
