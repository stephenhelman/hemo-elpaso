# RESTORE — undoing the lean-core overhaul

## Snapshot

| Item | Value |
| --- | --- |
| Git tag | `full-app-2026-11` (annotated, commit `a0f5569`) |
| Archive branch | `archive/full-app` (same commit, pushed to `origin`) |
| Database | **Not snapshotted** — mock data only. Restore via `prisma migrate reset` + seeds (`prisma/seeds/*`, `npm run seed`). |

Restore the whole app: `git checkout full-app-2026-11` (or `archive/full-app`), reinstall deps, `npx prisma generate`, `npx prisma migrate reset`.

Restore one feature: `git revert -m 1 <merge SHA>` of its `cut/<feature>` merge (table below), then restore the env vars / services listed.

Rules that make this work: migrations are additive only; tables and columns are never dropped or renamed (cut features leave dormant tables); every cut is a `cut/<feature>` branch merged with `--no-ff`.

**Legend:** rows were verified against the code during Phase 2; remaining _(inferred)_ marks (if any) were not re-verified.

## Phase 1 merges (not cuts)

| Branch | Merge SHA | Notes |
| --- | --- | --- |
| `phase1/auth-lockdown` | `1ea6745` | `src/middleware.ts`, `/api/session/board-check`, translate locked, `/api/translate/test` deleted, public event page no longer creates Patient rows. Also `85831b4` (baseline + import fixes) on main. |

## Cut features

Dirs are relative to `src/`. "Merge SHA" is filled in as each cut lands.

| Feature | Routes / dirs | npm deps | Env vars | Cron | External services | Out-of-repo restore steps | Merge SHA |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Patient portal** | `app/portal/*` (dashboard, events, profile, family, assistance, volunteer); `app/api/portal/*`; `app/api/patient/{profile,family-members}`; `components/portal/*`; `translation/portalSidebar.ts`, `components/layout/Portal*` | — | — | — | Auth0 (patient logins) | Auth0: remove board-only Post-Login Action (`docs/overhaul/auth0-board-action.js`) or add patients to allow-list | `7a4cbb9` |
| **Family system** | `app/api/portal/family/*`; `app/api/admin/family-approvals/*`; `app/admin/family-approvals`; `components/portal/FamilyPageContent.tsx`; `components/admin/FamilyApprovalsClient.tsx`; `lib/family-utils.ts` | — | — | — | — | None. Tables dormant: Family, FamilyMembership, BoardApproval, FamilyMember | `ee38356` |
| **Financial assistance** | `app/portal/assistance/*`; `app/api/portal/assistance/*`; `app/admin/assistance/*`; `app/api/admin/assistance/*`; `components/{portal,admin}/assistance/*` | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (shared with flyers/photos — keep) | `R2_*` (shared, keep) | — | Cloudflare R2 (documents) | None. Tables dormant: FinancialAssistanceApplication, AssistanceDocument, AssistanceDisbursement | `6767f28` |
| **Diagnosis verification** | `app/admin/verification`; `app/api/admin/verification/{patient,family}/*`; `components/admin/DiagnosisVerification*.tsx`; `components/portal/DiagnosisReminderBanner.tsx`, `components/portal/register/Diagnosis*` | — | — | — | R2 (letters) | None. Existing letters remain in R2 bucket; **do not delete the bucket objects** | `f907187` |
| **Volunteers** | `app/admin/volunteers`; `app/api/admin/volunteers/*`; `app/api/portal/volunteer/*`; `app/api/volunteer-inquiry`; `app/portal/volunteer/*`; `components/admin/VolunteersClient.tsx`; `components/get-involved/Volunteer*`; `messages/Volunteer*.tsx` | `@react-email/*` (shared) | — | — | Resend (emails) | None. Tables dormant: VolunteerProfile/Application/EventAssignment/Timecard/TimecardRole | `b13f5f1` |
| **Sponsors** | `app/admin/sponsors`; `app/api/admin/sponsors/*`; `app/api/admin/events/[id]/{sponsors,sponsor-invite}`; `app/admin/events/[id]/sponsors`; `app/api/sponsor/*`; `app/api/sponsor-inquiry`; `app/(public)/sponsor-access/[token]`; (public archive page went with cut/governance-docs); `components/sponsor/*`; `components/get-involved/Sponsor*`; `components/admin/InviteSponsorButton.tsx` | — | — | — | Resend; R2 (logos) | None. Tables dormant: Sponsor, EventSponsor, SponsorAccessToken | `31af590` |
| **Live events / polls / Q&A / Pusher** | `app/(public)/events/[slug]/live`; `app/(public)/event-polls/[token]`; `app/api/events/[id]/{live-state,polls,questions,announcements,itinerary,live-photos}`; `app/api/admin/{polls,questions}/*`; `app/api/admin/events/[id]/{polls,questions}`; `app/api/polls/create`; `app/admin/events/[id]/{polls,questions,announcements,itinerary}`; `components/events/live/*`; `components/{polls,event-polls}/*`; `components/admin/{polls,questions,announcements,itinerary}/*`; `lib/pusher-*.ts`; `lib/itinerary-status.tsx` | `pusher`, `pusher-js` | `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | — | Pusher Channels app | Re-add the 6 env vars in Vercel + `.env`. Tables dormant: Poll*, EventQuestion, EventAnnouncement, EventItineraryItem, PollCreationToken | `b8fd599` |
| **Presenter / CloudConvert** | `app/(public)/presenter/[token]`; `app/api/presenter/[token]/*`; `app/api/admin/events/presenter-invite`; `components/presenter/*`; `lib/cloudconvert.ts` | `cloudconvert` | `CLOUDCONVERT_API_KEY` | — | CloudConvert (slides → images) | Re-add API key. Tables dormant: PresenterAccessToken, EventPresentation | `5b426fc` |
| **Newsletter + crons** | `app/(public)/newsletter/*`; `app/admin/newsletter/*`; `app/api/admin/newsletter/*`; `app/api/cron/newsletter`; `components/admin/newsletter/*`; `lib/newsletter-generator.ts` (**`/api/unsubscribe`, `(public)/unsubscribe`, `lib/unsubscribe-token.ts`, `home/NewsletterSignup.tsx` were KEPT**); photo/poll/question `…/newsletter/route.ts` selectors | `@react-email/*` (shared) | `CRON_SECRET` (shared), `EMAIL_FROM` (shared) | `vercel.json`: `/api/cron/newsletter` `0 9 1 * *`. `/api/cron/send-reminders` `0 14 * * *` is KEPT (event reminders) | Resend | Restore `vercel.json` cron entry. Table dormant: Newsletter | `84fa960` |
| **Gmail send-as** | `app/api/auth/gmail/*`; `app/api/admin/gmail/send`; `components/admin/Gmail*.tsx`; `lib/gmail-oauth.ts`, `lib/gmail-crypto.ts` | `googleapis` | `GOOGLE_GMAIL_CLIENT_ID`, `GOOGLE_GMAIL_CLIENT_SECRET`, `GOOGLE_GMAIL_REDIRECT_URI`, `GMAIL_TOKEN_ENCRYPTION_KEY` | — | Google Cloud OAuth client (Gmail API) | Keep the OAuth client + redirect URI in Google Cloud Console; each board member must re-authorize. Stored tokens are encrypted with `GMAIL_TOKEN_ENCRYPTION_KEY` — **keep that key or they're unreadable** Tokens live in `BoardRole.gmail*` columns (verified) and were NOT cleared. | `7ee8633` |
| **Minutes** | `app/admin/minutes/*`; `app/api/admin/minutes/*`; `app/(public)/minutes/*`; `components/admin/minutes/*` | — | — | — | — | None. Table dormant: BoardMinutes | `4573b94` |
| **Tax filings** | `app/api/admin/archive/tax-filings`; tax-filings section of `app/admin/archive` (AdminArchiveClient); public `app/(public)/archive/financials` (verified in Phase 2) | — | — | — | R2 (Form 990 PDFs at `tax-filings/<year>/…` — verified) | None. Table dormant: TaxFiling. PDFs remain in R2 | `4573b94` (cut/governance-docs) |
| **Annual reports** | `app/api/admin/archive/annual-reports/*` (also `[id]`); annual-reports section of `app/admin/archive`; public `app/(public)/archive/*` (index, financials, board, sponsors, scholarships) — all removed together (verified) | — | — | — | None found for the API (no R2 calls in the route; stores URLs/data in DB) | None. Table dormant: AnnualReport. **Also removed in the same cut:** scholarship records (`api/admin/archive/scholarships/*`, table Scholarship dormant) — the static public `/scholarships` page is KEPT | `4573b94` (cut/governance-docs) |
| **Admin reports** | `app/admin/reports`; `components/admin/reports/*` (verified: no `/api/admin/reports` routes existed). **`app/admin/events/[id]/stats` and `components/admin/stats/*` were KEPT**, trimmed of poll/Q&A — not part of this cut | none (recharts was unused anywhere; removed in chore/unused-deps) | — | — | — | None | `ce9ab6a` |
| **Multi-step `/register`** | `app/(public)/register`; `app/api/patient/register`; `components/portal/register/*` (Consent, Diagnosis, FamilyMembers, Preferences, StepIndicator) | `@aws-sdk/client-s3` (shared) | `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` (address autocomplete, shared) | — | R2 (diagnosis letters); Google Places | None. **Replaced in Phase 2+ by the thin "Register for Information" form** — do not restore both at `/register` | `a56015a` |

## Deps removed in chore/unused-deps (`5230281`)

`@aws-sdk/client-sesv2`, `@aws-sdk/s3-request-presigner`, `@hookform/resolvers`, `bcryptjs`, `@types/bcryptjs`, `cloudconvert`, `googleapis`, `iron-session`, `jose`, `next-intl`, `pusher`, `pusher-js`, `qrcode.react`, `react-email`, `recharts`, `slugify`, `socket.io`, `socket.io-client`, `zod`, `pg`, `@types/pg`. Kept: `qrcode`, `html5-qrcode`. Several (socket.io, iron-session, jose, bcryptjs, recharts, …) were already unused before the overhaul. Restore by `git revert -m 1 5230281` or reinstalling per-row deps above.

## Shared env vars that stay (not cut-specific)

`NEXT_PUBLIC_BASE_URL`, `R2_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `DEEPL_API_KEY`, `CRON_SECRET`, `ADMIN_NOTIFY_EMAIL`, Auth0 vars (`AUTH0_*`, read by the SDK, not via `process.env` in `src/`).

## Phase 2 log

| Branch | Merge SHA | tsc before → after | Deps now unused (removed in chore/unused-deps) | Env vars now unused | Out-of-repo notes |
| --- | --- | --- | --- | --- | --- |
| `cut/live-events` | `b8fd599` | 81 → 61 | pusher, pusher-js | PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER, NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER | Pusher Channels app can be deleted/paused; re-add 6 env vars on restore. Also removed: event access QR, check-in email 'Join Live' CTA, liveEnabled toggle in edit form, poll/Q&A in event stats. |
| `cut/presenter` | `5b426fc` | 61 → 56 | cloudconvert | CLOUDCONVERT_API_KEY | Re-add API key on restore. Uploaded slide images (if any) remain in R2. |
| `cut/sponsors` | `31af590` | 56 → 54 | (none exclusive) | (none — R2 shared) | Sponsor logos remain in R2. SPONSOR_LIAISON board role and contact-form 'sponsor' topic intentionally kept. Public /archive/sponsors page left for cut/governance-docs. |
| `cut/newsletter` | `84fa960` | 54 → 50 | (none exclusive; @react-email/* still used) | (none — CRON_SECRET still used by send-reminders) | Restore the cron entry in vercel.json (0 9 1 * *). |
| `cut/gmail` | `7ee8633` | 50 → 50 | googleapis | GOOGLE_GMAIL_CLIENT_ID, GOOGLE_GMAIL_CLIENT_SECRET, GOOGLE_GMAIL_REDIRECT_URI, GMAIL_TOKEN_ENCRYPTION_KEY | Encrypted tokens still in boardRole.gmail* columns (not cleared). Recommend revoking the OAuth client / app access in Google Cloud + Google Account permissions. KEEP GMAIL_TOKEN_ENCRYPTION_KEY somewhere safe if you may restore. Dashboard 'token cleared when board member changes' logic was removed with the banner. |
| `cut/financial-assistance` | `6767f28` | 50 → 43 | (none exclusive; S3 shared) | (none) | Uploaded assistance documents and disbursement receipts remain in R2 (PHI-adjacent) — decide on retention/deletion separately. EmailTemplate rows for ASSISTANCE_*/DISBURSEMENT_ISSUED remain in DB until cut/admin-trim. |
| `cut/volunteers` | `b13f5f1` | 43 → 43 | (none) | (none) | EmailTemplate rows VOLUNTEER_* remain in DB until cut/admin-trim. Attendee-role options (patient/sponsor/donor/volunteer) in manual check-in intentionally kept — they're check-in categories. |
| `cut/family-system` | `ee38356` | 43 → 43 | (none) | (none) | check-in QR preview still reads RSVP.familyMembershipIds (empty for new RSVPs) — revisit in Phase 4. FAMILY_MEMBER_INVITE EmailTemplate row remains until cut/admin-trim. |
| `cut/verification` | `f907187` | 43 → 40 | (none) | (none) | Diagnosis letters previously uploaded remain in R2 (PHI) — decide on retention/deletion separately. Admin user detail page no longer shows verification card. |
| `cut/patient-portal` | `7a4cbb9` | 40 → 36 | (none) | (none) | Email templates still link to /portal/* (RsvpConfirmation, EventReminder, EventPublished, WelcomeEmail) — fixed in cut/admin-trim. /api/rsvp is gone, so the event page RSVP button is non-functional until cut/register replaces it. Restoring requires Auth0 allow-list/Action to permit patient logins. |
| `cut/register` | `a56015a` | 36 → 36 | (none) | (none — R2/S3 still used by flyers & photos) | Event page RSVP is a placeholder until Phase 4. NEXT_PUBLIC_GOOGLE_PLACES_API_KEY still used by PlacesAutocompleteInput (event forms). |
| `cut/governance-docs` | `4573b94` | 36 → 35 | (none) | (none) | Covers rows: Minutes, Tax filings, Annual reports (verified: all live under admin/archive, api/admin/archive, (public)/archive/*; no separate public tax/annual pages). Uploaded PDFs remain in R2. |
| `cut/admin-reports` | `ce9ab6a` | 35 → 35 | (none) | (none) | Verified: no /api/admin/reports routes existed; recharts was not used by this feature. |
| `cut/admin-trim` | `f9a6c84` | 35 → 35 | (none) | (none) | Dormant EmailTemplate rows for removed types remain in DB (hidden from admin list). RsvpConfirmation lost its QR/portal section — Phase 4 should add the QR to the email. returnTo=/admin works via new src/app/admin/page.tsx redirect. |
| `chore/unused-deps` | `5230281` | 35 → 35 | removed 21 packages (see commit) | (none) | Restore a cut feature: reinstall its deps (see each RESTORE row) — package.json/lock diff is in this merge; revert -m 1 it or re-add per row. |

## Phase 3 log

| Branch | What changed | Dormant things reactivated / removed |
| --- | --- | --- |
| `feat/thin-patient-schema` | Migration `20261113180000_thin_patient_consent` (additive; `patients.auth0Id`/`email` made nullable, email UNIQUE→index; `consent_records` + UPDATE-reject trigger; 4 AuditAction values). | Old `Patient.consentToContact/consentToPhotos/consentDate` columns stay dormant (superseded by `ConsentRecord`). To undo the schema: do NOT drop columns; revert code only. |
| `feat/register-info` | `/register-info` public form + `/api/register-info`, Turnstile, honeypot, confirmation email; homepage/footer/nav/sitemap. | **Removed** `components/home/NewsletterSignup.tsx` (was left in place by cut/newsletter) and its translation; footer newsletter stub forms replaced with a link. New env vars: `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`. `/register` (archived multi-step flow) is untouched and must not be restored over `/register-info`. |
