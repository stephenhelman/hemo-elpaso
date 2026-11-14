# CUTOVER — moving the site to hemoelpaso.org

Primary domain after cutover: **hemoelpaso.org** (apex). `www.hemoelpaso.org`,
`hemo-el-paso.org` and `www.hemo-el-paso.org` all redirect to it.

Nothing in the code hardcodes a domain any more (see "How the app finds its domain").
Every step below is a dashboard change plus one redeploy.

> **Order matters.** Do Part A (prep) *before* the domain arrives, Part B on the
> day, Part C (email) only after Resend says the new domain is verified.

## How the app finds its domain

| Variable | What it controls | Cutover value |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | sitemap, robots, canonical/OG URLs, JSON-LD, links and QR image URLs in emails | `https://hemoelpaso.org` |
| `AUTH0_BASE_URL` | Auth0 callback/logout URLs, the "different account" button | `https://hemoelpaso.org` |
| `NEXT_PUBLIC_EMAIL_DOMAIN` | the domain of mailboxes shown/used by the app (`info@…`, `events@…`, board addresses, `noreply@…`) | keep `hemo-el-paso.org` until Part C, then `hemoelpaso.org` |
| `EMAIL_FROM` | sender of every email | keep the old domain until Part C, then `HOEP (DO NOT REPLY)<noreply@hemoelpaso.org>` |
| `REGISTRATION_OPEN` | public Register-for-Information + public RSVP | `false` until you're ready |

`NEXT_PUBLIC_*` values are baked in **at build time**: changing one in Vercel
does nothing until you **redeploy** (Deployments → ⋯ → Redeploy, untick "use existing build cache").

## Part A: before the domain transfers (do now)

1. **Deploy `main` to Production with `REGISTRATION_OPEN=false`** (steps in the hand-off message; env table at the bottom of this file).
2. **Lower the TTL** on the *old* DNS records (A/CNAME for `@` and `www` at the current provider) to 300 s, at least a day ahead. This makes a rollback fast.
3. **Inventory the old domain's email records** (fill in Part D). Do it *before* anything moves; you can't read them after.
4. In **Resend → Domains → Add Domain → `hemoelpaso.org`** (region us-east-1). Keep the DNS records Resend shows open in a tab for Part C. You can't verify until the domain is in your DNS.
5. In **Cloudflare → Turnstile → your widget → Hostnames**, add `hemoelpaso.org` and `www.hemoelpaso.org` now (adding doesn't remove the old one).

## Part B: the day hemoelpaso.org transfers to you

### B1. Put the domain in Vercel
Vercel → project → **Settings → Domains → Add**:
1. Add `hemoelpaso.org` and set it as the **Primary** (production) domain.
2. Add `www.hemoelpaso.org` → choose **Redirect to `hemoelpaso.org`** (308).
3. Edit `hemo-el-paso.org` → **Redirect to `hemoelpaso.org`** (308). Same for `www.hemo-el-paso.org`.
   (Both old names must stay in the Vercel project for redirects to work.)

### B2. DNS at the registrar/DNS host for **hemoelpaso.org**
Use exactly what Vercel shows next to each domain (Settings → Domains → "Invalid Configuration → View"); today's values are:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Remove any parking-page A/AAAA/CNAME records on `@` and `www` first. Add the mail records in Part D at the same time so mail doesn't break.

For **hemo-el-paso.org**, keep its DNS where it is, but point it at Vercel the same way (A `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`) so Vercel can serve the redirect. **Leave its MX/TXT records alone.** Mail still lives there until you move it.

Wait for Vercel to show a green check + certificate issued on each domain (usually minutes, up to an hour).

### B3. Production environment variables (Vercel → Settings → Environment Variables → *Production*)

| Variable | Change to |
| --- | --- |
| `NEXT_PUBLIC_BASE_URL` | `https://hemoelpaso.org` |
| `AUTH0_BASE_URL` | `https://hemoelpaso.org` |
| `REGISTRATION_OPEN` | `false` (leave closed until the smoke test passes) |
| `NEXT_PUBLIC_EMAIL_DOMAIN` | **don't change yet** (Part C) |
| `EMAIL_FROM` | **don't change yet** (Part C) |
| everything else (`AUTH0_ISSUER_BASE_URL`, `AUTH0_SECRET`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`, `TURNSTILE_*`, `CHECKIN_TOKEN_KEY`, `CRON_SECRET`, `R2_*`, `DEEPL_API_KEY`, `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`) | unchanged. None of them contains the website's domain. |

Then **Redeploy Production** (no build cache).

### B4. Auth0 (Applications → your application → Settings)
Add the new URLs (keep the old ones until the smoke test passes):

* **Allowed Callback URLs**: `https://hemoelpaso.org/api/auth/callback`
* **Allowed Logout URLs**:
  * `https://hemoelpaso.org`
  * `https://hemoelpaso.org/api/auth/login?returnTo=/admin&prompt=login`
* **Allowed Web Origins**: `https://hemoelpaso.org`

Save. The Google social connection needs no change (its redirect URI is your Auth0 tenant's domain, not the website). The board allow-list Action is unaffected.

### B5. Turnstile
Confirm `hemoelpaso.org` is in the widget's hostnames (Part A5). Without it the sign-up form's check fails on the new domain.

### B6. Sanity (for later, Phase 5)
Sanity → manage.sanity.io → project → **API → CORS origins** → add `https://hemoelpaso.org` (and `https://www.hemoelpaso.org` if you embed there) with credentials allowed. Not needed until the CMS is wired.

## Part C: email on the new domain (after B works)

1. In **Resend → Domains → hemoelpaso.org**, add the DNS records Resend lists at your DNS host: the SPF/MX record(s) on the `send` subdomain, the DKIM record(s) (`resend._domainkey`), and the optional DMARC TXT. Copy them exactly, since values are unique to you.
2. Click **Verify** in Resend. Wait for status **Verified**. **Do not change anything below until it is.**
3. Vercel → Production env: set `NEXT_PUBLIC_EMAIL_DOMAIN=hemoelpaso.org` and `EMAIL_FROM=HOEP (DO NOT REPLY)<noreply@hemoelpaso.org>`. Redeploy.
4. Send a test (smoke test step 8). Keep `hemo-el-paso.org` verified in Resend until you've confirmed delivery and replies work.
5. Role mailboxes shown in the app (`info@`, `events@`, `president@` …) need to **exist** on the new domain (set up at the new mail provider) before step 3, or replies to them bounce.

## Part D: mail records at the old provider (fill in before the day)

Recreate these at the new DNS host for `hemoelpaso.org` if you're keeping the same mail provider, or note what changes.

| Type | Name | Priority | Value | Purpose |
| --- | --- | --- | --- | --- |
| MX | | | | |
| MX | | | | |
| TXT | `@` | | | SPF |
| TXT | | | | DKIM |
| TXT | `_dmarc` | | | DMARC |
| TXT | | | | domain verification (Google/Microsoft/…) |
| CNAME | | | | |
| other | | | | |

## Part E: smoke test (run in a private window)

1. `https://hemoelpaso.org` loads over HTTPS. `http://`, `www.hemoelpaso.org`, `hemo-el-paso.org` and `www.hemo-el-paso.org` all redirect to `https://hemoelpaso.org`.
2. `/events` lists events; open one; the sidebar says **"To RSVP, call 915-621-8291."** (registration closed).
3. `/register-info` shows the "Online registration isn't open yet" page.
4. `/sitemap.xml` and `/robots.txt` show `hemoelpaso.org` URLs only (no old domain, no `/register-info`).
5. View source on the homepage: canonical/og URLs and JSON-LD use `hemoelpaso.org`.
6. **Admin login**: `/admin` → sign in with a board account → lands on `/admin/dashboard`. Also try a non-board account → `/access-denied`, then "Sign in with a different account" shows the account picker.
7. **Invitation link** (admin → an event → Invitations): open a `/rsvp/…` link → RSVP page works and the QR image loads.
8. **Email**: in admin → Settings → Email templates send a test email to yourself, or use "Resend" on a patient with "Confirmation not sent". Check Resend → Emails for `delivered`, and that links in the email point at `hemoelpaso.org`.
9. **Form with registration on, on a test basis**: set `REGISTRATION_OPEN=true` in Vercel Production, redeploy, submit `/register-info` with a `+test` address, confirm: success message, confirmation email arrives, patient appears in admin → Patients. **Delete the test patient** (admin → Patients → Delete). Set `REGISTRATION_OPEN=false` again and redeploy until you want to launch.
10. `https://hemoelpaso.org/api/cron/send-reminders` without credentials returns 401 (cron is protected).

## Rollback

| Symptom | Do this |
| --- | --- |
| New domain not resolving / wrong certificate | Not an app problem. Wait for Vercel's green check. If urgent, point DNS back (A `@` and CNAME `www` at the old provider's values; TTL was lowered in Part A so it reverts in minutes). |
| Site loads but **login fails** (callback mismatch) | Auth0 URLs missing: re-check B4. Meanwhile use the `https://<project>.vercel.app` URL **only if** it's also in Auth0's Allowed Callback URLs, or set `AUTH0_BASE_URL`/`NEXT_PUBLIC_BASE_URL` back to the old domain and redeploy. |
| Sign-up form fails the security check | Turnstile hostnames (B5). |
| Emails not arriving / `Confirmation not sent` appears | Set `EMAIL_FROM` and `NEXT_PUBLIC_EMAIL_DOMAIN` back to the old domain (verified in Resend) and redeploy. |
| Anything else broken after the redeploy | Vercel → Deployments → previous good deployment → ⋯ → **Promote to Production** (instant, no rebuild). |
| Need to close sign-ups immediately | `REGISTRATION_OPEN=false` → redeploy. The API routes return 404 and the pages show the phone number. |

The Vercel-provided `https://<project>.vercel.app` URL always keeps working while you debug DNS.

## Production environment variables: complete list

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | production Neon (pooled) |
| `AUTH0_SECRET`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER_BASE_URL` | unchanged |
| `AUTH0_BASE_URL` | site URL |
| `NEXT_PUBLIC_BASE_URL` | site URL |
| `NEXT_PUBLIC_EMAIL_DOMAIN` | mailbox domain (optional; default `hemo-el-paso.org`) |
| `RESEND_API_KEY`, `EMAIL_FROM` | **required**; without `EMAIL_FROM` production refuses to send |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | **required** for the public forms |
| `CHECKIN_TOKEN_KEY` | **new, required**: 64 hex chars (`openssl rand -hex 32`). Keep a copy somewhere safe. |
| `CRON_SECRET` | reminder cron auth |
| `REGISTRATION_OPEN` | `false` / `true` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | flyers/photos |
| `DEEPL_API_KEY` | board-only translate |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | address autocomplete |
