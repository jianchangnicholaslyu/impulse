# IMPULSE J Resend Setup

IMPULSE J sends account and transactional email through Resend from Vercel serverless functions.

## Environment Variables

Set these in Vercel Project -> Settings -> Environment Variables for Production and Preview:

```text
RESEND_API_KEY=YOUR_RESEND_API_KEY
RESEND_FROM_AUTH=IMPULSE J Auth <auth@auth.impulse.ccwu.cc>
RESEND_FROM_NOTIFY=IMPULSE J Notify <notify@auth.impulse.ccwu.cc>
RESEND_FROM_SUPPORT=IMPULSE J Support <support@auth.impulse.ccwu.cc>
```

The Resend API key must never be committed or exposed in frontend code.

## Current Free-Plan Sender Layout

The free Resend plan allows one custom domain. Until the project upgrades, all sender identities use the verified domain:

```text
auth.impulse.ccwu.cc
```

Future paid-plan migration can move notification and support senders to:

```text
notify.impulse.ccwu.cc
support.impulse.ccwu.cc
```

Only Vercel environment variables need to change for that migration.

## API Routes

- `POST /api/auth/send-code`
- `POST /api/auth/verify-code`
- `POST /api/auth/send-magic-link`
- `POST /api/auth/password-reset`
- `POST /api/internal/email/send-notification`
- `GET /api/health/email`

Internal email routes require `BACKEND_SECRET` in `Authorization: Bearer ...` or `X-Backend-Secret`.

## Language Policy

Official system emails are English-only. Do not add localized transactional templates for verification codes, magic links, password resets, order notices, dispute notices, withdrawal notices, or admin alerts. The rendered email body includes `class="notranslate"` and `translate="no"` so browser or mailbox translation tools do not rewrite official communication terms by default.

## Security Rules

- Verification codes are stored as hashes.
- Verification codes expire after 5 minutes.
- The same email can request one code every 60 seconds.
- The same IP can request at most 5 codes every 10 minutes.
- Code request responses avoid confirming whether an email exists.
- Production email fails closed if Resend or verified sender domains are not configured.
