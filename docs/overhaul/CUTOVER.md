# CUTOVER: hemoelpaso.org becomes the primary domain

Canonical host: **https://hemoelpaso.org** (apex, no www). `www.hemoelpaso.org` redirects to it. The old
**hemo-el-paso.org** (and `www.`) redirect to it with the path and query kept (308), **except** `/brand/*` and
`/api/checkin-qr/*`, which keep being served from the old host because they are the images inside emails that were
already sent (logo, QR code) and some mail clients do not follow redirects for images.

## How it works (code)

| Piece | Where |
| --- | --- |
| One source of truth for the site's URL | `siteUrl()` / `SITE_URL` in `src/lib/site.ts`. Reads `NEXT_PUBLIC_SITE_URL`, falls back to `NEXT_PUBLIC_BASE_URL` (old name). **Production with neither set throws** (and `scripts/vercel-build.mjs` fails the build). Previews use `VERCEL_URL`; local dev uses `http://localhost:3000` |
| Old host and www redirects | `redirects()` in `next.config.mjs`, rules from `scripts/host-redirects.mjs`. Chosen over `middleware.ts` because redirects() is matched against **every** path (middleware only runs for its short matcher list). Query strings are kept automatically. No redirects are generated for localhost or `*.vercel.app` |
| Mail "from" addresses | **Unchanged** (`NEXT_PUBLIC_EMAIL_DOMAIN`, `EMAIL_FROM`) until hemoelpaso.org is verified in Resend. See the TODO in `emailDomain()` |
| Do NOT also set a Vercel domain redirect for the old hosts | It would redirect `/brand/*` and `/api/checkin-qr/*` too. Attach them as ordinary domains and let the app redirect |

## Cutover checklist (do these in this order)

**0. Before you start.** Merge `chore/primary-domain` and deploy to Production **with the env vars unchanged**. It is safe: with the old host still canonical nothing visible changes. Confirm the site still works.

**1. Vercel: add the domains** (Settings → Domains). Add `hemoelpaso.org` and `www.hemoelpaso.org` as ordinary domains (no Vercel redirect). Make `hemoelpaso.org` the primary production domain. Keep `hemo-el-paso.org` and `www.hemo-el-paso.org` attached as ordinary domains. If either currently has a Vercel redirect set, remove it. Vercel shows the exact DNS records for each; use those values.

**2. Cloudflare DNS for hemoelpaso.org.** Lower TTLs first (300 s). Create the records Vercel lists, normally:

| Type | Name | Value | Proxy |
| --- | --- | --- | --- |
| A | `@` | `76.76.21.21` | **DNS only** (grey cloud) |
| CNAME | `www` | `cname.vercel-dns.com` | **DNS only** (grey cloud) |

Wait for the green check and issued certificate on both domains in Vercel (minutes to an hour). Leave hemo-el-paso.org's DNS exactly as it is (its mail records must not change).

**3. Add the new origins everywhere (additive, before the switch).**
- **Auth0** (Application → Settings). Add, do not remove:
  - Allowed Callback URLs: `https://hemoelpaso.org/api/auth/callback`
  - Allowed Logout URLs: `https://hemoelpaso.org` and `https://hemoelpaso.org/api/auth/login?returnTo=/admin&prompt=login`
  - Allowed Web Origins: `https://hemoelpaso.org`
  - Keep the old URLs for 30 days.
- **Cloudflare Turnstile** → widget → Hostnames: add `hemoelpaso.org` and `www.hemoelpaso.org`.
- **Sanity** (manage.sanity.io → API → CORS origins): add `https://hemoelpaso.org`, **Allow credentials** ticked.
- **R2 bucket CORS**: add `https://hemoelpaso.org` to AllowedOrigins (methods PUT, GET, HEAD; headers `content-type`, `content-length`; the admin photo upload PUTs straight from the browser). Check what is allowed today and keep the existing entries.
- **Google Cloud** (only if the Places key has HTTP-referrer restrictions): add `https://hemoelpaso.org/*`. The key is used on admin forms only.

**4. Production environment variables** (Vercel → Settings → Environment Variables → Production):
- `NEXT_PUBLIC_SITE_URL` = `https://hemoelpaso.org` (new)
- `AUTH0_BASE_URL` = `https://hemoelpaso.org`
- Leave `NEXT_PUBLIC_BASE_URL` alone (it is only a fallback now; delete it in step 11).
- Do **not** change `NEXT_PUBLIC_EMAIL_DOMAIN` or `EMAIL_FROM`.

Then **Redeploy Production with "use existing build cache" unticked** (`NEXT_PUBLIC_*` values and the redirect rules are fixed at build time).

**5. Sanity webhook** (API → Webhooks): change the URL to `https://hemoelpaso.org/api/revalidate`. Keep the same secret.

**6. R2 custom domain `media.hemoelpaso.org`** (can be done any time after step 2):
1. Cloudflare → R2 → the bucket → Settings → Custom Domains → add `media.hemoelpaso.org`.
2. Cloudflare → hemoelpaso.org → Security → WAF → Custom rules → create a **Block** rule, expression:
   `(http.host eq "media.hemoelpaso.org" and (starts_with(http.request.uri.path, "/photos-pending/") or starts_with(http.request.uri.path, "/uploads/")))`
   (the admin reads pending photos through an authenticated route, so nothing public needs these paths).
3. Add `https://hemoelpaso.org` to the bucket CORS if not already there (step 3).
4. Set `R2_PUBLIC_URL` = `https://media.hemoelpaso.org` in Production and redeploy.
5. **Rewrite the stored URLs.** Existing rows hold full URLs written at upload time, so the env change alone does not move them: `npx tsx scripts/rewrite-media-urls.ts --from <old R2_PUBLIC_URL> --to https://media.hemoelpaso.org` (dry run), then add `--apply`. Run it with the production `DATABASE_URL` in your shell for that one command.
6. Check a public gallery photo and a flyer load from `media.hemoelpaso.org`, and that `https://media.hemoelpaso.org/photos-pending/x` is blocked.
7. Only then turn off the old public `r2.dev` URL for the bucket (it cannot be filtered by path).

**7. Resend (later, when you are ready to move mail).** Resend → Domains → Add `hemoelpaso.org` (region us-east-1), add the SPF/MX (`send` subdomain), DKIM and DMARC records it lists in Cloudflare DNS, click Verify. Only when it says Verified: set `NEXT_PUBLIC_EMAIL_DOMAIN=hemoelpaso.org` and `EMAIL_FROM` to a hemoelpaso.org sender, switch `PRIVACY_EMAIL` in `src/lib/site.ts` to `mailbox("privacy")`, create the role mailboxes on the new domain, redeploy. Keep the old domain verified until replies are confirmed.

**8. Google Search Console.** Add a **Domain property** for `hemoelpaso.org` (verify with the DNS TXT record in Cloudflare), submit `https://hemoelpaso.org/sitemap.xml`. In the old property use **Change of address** if the tool is offered (it needs the old site to be redirecting, which it now is).

**9. Smoke test** (private window), see below.

**10. Keep the old domain.** Leave hemo-el-paso.org registered and attached to the project for as long as old emails can be opened (unsubscribe links never expire). Do not let it lapse.

**11. After 30 days:** remove the old Auth0 callback/logout/origin URLs, the old Sanity CORS origin and the old Turnstile hostname, and delete `NEXT_PUBLIC_BASE_URL`.

## What people will notice

- **Board members sign in again once** on the new host (the Auth0 session cookie belongs to one host).
- **Language:** the `locale` cookie is also per host. Families who open an emailed link keep their language because those links carry `?lang=es` and the redirect keeps the query. Someone who types the address or uses a bookmark sees English once, until they switch (then it is remembered for a year).
- No cookie sets a `domain`, so nothing needs changing there.
- Emails sent before the switch keep working: page links redirect; the logo and QR image are served directly from the old host.

## Smoke test

Replace `<token>` with a real invitation or check-in token where noted. `-I` shows the redirect without following it.

1. Old host, page links keep path and query:
   `curl -sI "https://hemo-el-paso.org/rsvp/<token>?lang=es"` → `308`, `location: https://hemoelpaso.org/rsvp/<token>?lang=es`. Same for `/confirm/<token>?lang=es`, `/api/unsubscribe?token=<token>&lang=es`, `/admin`, `/api/auth/callback?code=x&state=y`, and `www.hemo-el-paso.org`.
2. Old host, images still served (no redirect): `curl -sI https://hemo-el-paso.org/brand/email-header.png` → `200`; `curl -sI https://hemo-el-paso.org/api/checkin-qr/<token>` → `200` image/png for a live token.
3. `curl -sI https://www.hemoelpaso.org/events?lang=en` → `308` to `https://hemoelpaso.org/events?lang=en`.
4. `https://hemoelpaso.org` loads over HTTPS; `/sitemap.xml` and `/robots.txt` list only hemoelpaso.org; view source: canonical, og:url and JSON-LD use hemoelpaso.org.
5. Sign in at `https://hemoelpaso.org/admin` with a board account → lands on `/admin/dashboard`. A non-board account → `/access-denied`, and "Sign in with a different account" shows the picker.
6. Studio: `/admin/studio` loads; edit and publish a trivial change, confirm it appears on the site within seconds (webhook works).
7. Upload and approve a test photo (R2 CORS + new media host); a form with Turnstile works (`/contact`).
8. Email: send a test (admin → Settings → Email templates, or Resend a confirmation). Links and the QR image in it point at `hemoelpaso.org`; sender is still the old verified domain.
9. `https://hemoelpaso.org/api/cron/retention` and `/api/cron/send-reminders` without credentials return 401.

## Environment variables that hold a URL or host

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://hemoelpaso.org` | **The** site URL. Build-time. Required in Production |
| `NEXT_PUBLIC_BASE_URL` | (old name) | Fallback only; remove after the cutover settles |
| `AUTH0_BASE_URL` | `https://hemoelpaso.org` | Read by the Auth0 SDK; must match the Auth0 dashboard URLs |
| `AUTH0_ISSUER_BASE_URL` | Auth0 tenant | unchanged |
| `R2_PUBLIC_URL` | `https://media.hemoelpaso.org` after step 6 | Full URLs are stored in the DB: run `scripts/rewrite-media-urls.ts` |
| `NEXT_PUBLIC_EMAIL_DOMAIN`, `EMAIL_FROM` | old verified domain | Change only in step 7 |

## Rollback

| Symptom | Do this |
| --- | --- |
| New domain not resolving / wrong certificate | Not an app problem. Wait for Vercel's green check. DNS only (grey cloud) records, and no Cloudflare proxy in front |
| **Login fails** (callback mismatch) | Auth0 URLs missing (step 3). Meanwhile set `AUTH0_BASE_URL` and `NEXT_PUBLIC_SITE_URL` back to the old domain and redeploy |
| Sign-up/contact form fails the security check | Turnstile hostnames (step 3) |
| Photo upload fails in admin | R2 bucket CORS (step 3) |
| Photos or flyers broken after step 6 | Put `R2_PUBLIC_URL` back; if rows were rewritten, run `rewrite-media-urls.ts` with `--from`/`--to` swapped |
| Edits in Sanity don't appear | Webhook URL (step 5) or Sanity CORS |
| Anything else after the redeploy | Vercel → Deployments → previous good deployment → ⋯ → **Promote to Production** (instant) |
| Need to close sign-ups immediately | `REGISTRATION_OPEN=false` → redeploy |

## Database migrations on deploy

Production migrations are **automatic**: each Production deploy runs `prisma migrate deploy` before `next build`
(`scripts/vercel-build.mjs`, set in `vercel.json`); previews never migrate. Before the first Production deploy make sure
`DIRECT_URL` is set for Production and that the dashboard Build Command override is off. Full workflow and the manual
fallback (`npm run db:deploy`, needs `.env.production.local` and a typed confirmation): `docs/DATABASE.md`.

## After any database reset/restore

Seed the email template catalogue (admin → Settings → Email templates) or it stays empty:
`npm run db:seed-templates` on a dev DB, or on production (on purpose):
`ALLOW_PROD_DB=yes npx tsx scripts/seed-templates.ts` (with the production `DATABASE_URL`/`DIRECT_URL` in your shell). Idempotent. `scripts/bootstrap-admin.ts` also does it.

## Production environment variables: complete list

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | production Neon (pooled). Production only: the Preview environment gets the **dev branch** string instead |
| `DIRECT_URL` | production Neon, **direct** (non-pooled). Needed because every Production build runs `prisma migrate deploy` |
| `AUTH0_SECRET`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER_BASE_URL` | unchanged |
| `AUTH0_BASE_URL` | site URL |
| `NEXT_PUBLIC_SITE_URL` | site URL (`https://hemoelpaso.org`); `NEXT_PUBLIC_BASE_URL` is the old name, fallback only |
| `NEXT_PUBLIC_EMAIL_DOMAIN` | mailbox domain (optional; default `hemo-el-paso.org`) |
| `RESEND_API_KEY`, `EMAIL_FROM` | **required**; without `EMAIL_FROM` production refuses to send |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | **required** for the public forms |
| `CHECKIN_TOKEN_KEY` | **new, required**: 64 hex chars (`openssl rand -hex 32`). Keep a copy somewhere safe. |
| `CRON_SECRET` | reminder cron auth |
| `REGISTRATION_OPEN` | `false` / `true` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | flyers/photos |
| `DEEPL_API_KEY` | board-only translate |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | address autocomplete |
