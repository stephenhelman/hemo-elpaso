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
- **R2 bucket CORS**: add `https://hemoelpaso.org` to AllowedOrigins (methods PUT, GET, HEAD; headers `content-type`, `content-length`; the admin photo and flyer uploads PUT straight from the browser). Check what is allowed today and keep the existing entries.
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

## When HOEP's Twilio number goes live (phone system)

**(915) 539-7353 is an officer's personal number. It does not move to Twilio. Take it off the site when the new HOEP
number goes live** (after the phone menu, voicemail and policy v3 are live; see `PHONE_AUDIT.md`).

### Everything below must be true before the new number goes on the website or a flyer

**A. Decisions and wording**
- [ ] The board has approved policy v3 (`docs/legal/POLICY_V3_DRAFT.md`, including "Statements to confirm").
- [ ] A Spanish speaker has reviewed the spoken lines and the new policy text (`ES_REVIEW.md`).
- [ ] The attorney has answered, or the board has accepted as open, `ATTORNEY_QUESTIONS.md` 26, 28, 29 and 30.
- [ ] `LEGAL_EFFECTIVE_DATE` is set (it dates all three legal pages).

**B. Deployed**
- [ ] The voicemail and policy branches are merged and deployed together; the build log shows the migration applied.
- [ ] `/privacy` shows version 3 with the right date, in both languages.

**C. Twilio console** (`TWILIO_SETUP.md`)
- [ ] vicepresident@ owner and president@ user, both with two-factor authentication; nobody else.
- [ ] Account upgraded; number bought; geographic permissions US only; spending alerts and low-balance notice set.
- [ ] **Enforce HTTP Auth on Media URLs is on.** Call recording and transcription are otherwise off.
- [ ] Fallback TwiML Bin holds the current text; "A call comes in" and "Primary handler fails" are set.

**D. Vercel, Production**
- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_FALLBACK_NUMBER`, `PHONE_DATA_KEY`
      (a copy of the key kept safely); `TWILIO_MODE` unset; redeployed. Preview has none of them.
- [ ] `CRON_SECRET` is set and `/api/cron/retention` shows 200 in the logs.

**E. In the site**
- [ ] Every menu option has a verified duty number, with the right hours.
- [ ] Settings → Phone shows no warnings.
- [ ] president@ and vicepresident@ receive mail; the "New voicemail" route's test arrives.
- [ ] The President and Vice President can open Admin → Voicemail; the Secretary and admin@ cannot.
- [ ] "Phone line" feature toggle is on.

**F. Tested on the real number**
- [ ] Every box under "Test calls after setup" in `TWILIO_SETUP.md`.
- [ ] Whoever answers knows to press 1 to take a call, and the board has agreed who returns messages and from which phone.
      (Admin → Voicemail → "Show number" gives the President and Vice President the caller's number. The number said in
      the message is the backup, for hidden numbers.)

### Then publish the number and remove the old one

- [ ] **Code:** change the five fields of `SITE_PHONE` in `src/lib/site.ts`. That one constant feeds the footer, contact
      page, scholarship contacts, every email, the RSVP and registration messages (`{phone}`), the legal pages
      (`{PHONE}`), the schema.org data, the Sanity fallback and `scripts/seed-sanity.ts`.
- [ ] **Code, examples only:** the sample number in `src/sanity/schemas/documents/siteSettings.ts`,
      `src/sanity/schemas/objects/link.ts` and `scripts/check-conferences.ts`.
- [ ] **Sanity (production dataset):** Studio → Site settings → phone (display and E.164). Then search the other
      documents for the old number, including links of type "phone" and people or resource entries. The site shows the
      Sanity value over the code value.
- [ ] **Flyer templates:** the repository has none. Check the design files flyers are made from, and flyers already
      uploaded for upcoming events; replace and re-upload any that print the number.
- [ ] **Letterhead:** `npx tsx scripts/make-letterhead.ts`, then re-export `brand/HOEP-letterhead.pdf`.
- [ ] **Database email templates:** Admin → Settings → Email Templates: look for the number.
- [ ] **Legal pages:** they change with `SITE_PHONE`; set the effective date with the policy v3 release.
- [ ] **Outside the site:** Facebook group, business listings, printed material.
- [ ] **Verify:** `grep -rnE "539[-. )]*7353|5397353" src scripts` finds nothing, and the live home, contact and privacy
      pages show the new number.

## Old-site URLs (the previous hemoelpaso.org website)

`scripts/legacy-redirects.mjs` (loaded by `next.config.mjs` after the host rules) sends the old site's URLs to the closest new page with a 308 (query kept):

| Old path | New page |
| --- | --- |
| `/home-1104`, `/home` | `/` |
| `/about-us-5023`, `/about-us` | `/about` |
| `/resources-2315` | `/resources` |
| `/get-involved-2932` | `/get-involved` |
| `/calendar-of-events-3522`, `/calendar-of-events` | `/events` |
| `/contact-us-6020`, `/contact-us` | `/contact` |
| `/scholarships-9537` | `/scholarships` |
| `/event-registration-contact-form` | `/events` |
| `/event-sponsorship-contact-form` | `/contact` |

The old unsuffixed `/get-involved`, `/resources` and `/scholarships` are real routes of the new site, so they are not redirected. `npm run check:legacy-redirects` fails if a rule ever collides with a real route. Source list: the old-site archive (`data/links.csv`, `wayback/index.md`).

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
9. Old-site URLs: `curl -sI https://hemoelpaso.org/about-us-5023` → `308`, `location: /about` (and `/contact-us-6020?lang=es` keeps its query). `/get-involved` itself is `200`.
10. `https://hemoelpaso.org/api/cron/retention` and `/api/cron/send-reminders` without credentials return 401.

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
| Photo or flyer upload fails in admin | The error on screen and the Vercel log (`[flyers]` / `[photos]`) name the step; if it is the upload itself, R2 bucket CORS (step 3) |
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
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | **required** (flyers/photos): the production build fails and the server will not start without them |
| `DEEPL_API_KEY` | board-only translate |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | phone line (`TWILIO_SETUP.md`); optional `TWILIO_API_KEY_SID`/`_SECRET`, `TWILIO_FALLBACK_NUMBER`. Production only |
| `PHONE_DATA_KEY` | **required for voicemail:** 64 hex chars (`openssl rand -hex 32`). Production only; keep a copy somewhere safe |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | address autocomplete |
