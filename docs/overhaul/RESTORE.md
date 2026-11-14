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

**Legend:** items marked _(inferred)_ were deduced from imports/naming rather than confirmed by reading every file. Verify before relying on them in Phase 2.

## Phase 1 merges (not cuts)

| Branch | Merge SHA | Notes |
| --- | --- | --- |
| `phase1/auth-lockdown` | `1ea6745` | `src/middleware.ts`, `/api/session/board-check`, translate locked, `/api/translate/test` deleted, public event page no longer creates Patient rows. Also `85831b4` (baseline + import fixes) on main. |

## Cut features

Dirs are relative to `src/`. "Merge SHA" is filled in as each cut lands.

| Feature | Routes / dirs | npm deps | Env vars | Cron | External services | Out-of-repo restore steps | Merge SHA |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Patient portal** | `app/portal/*` (dashboard, events, profile, family, assistance, volunteer); `app/api/portal/*`; `app/api/patient/{profile,family-members}`; `components/portal/*`; `translation/portalSidebar.ts`, `components/layout/Portal*` | — | — | — | Auth0 (patient logins) | Auth0: remove board-only Post-Login Action (`docs/overhaul/auth0-board-action.js`) or add patients to allow-list | |
| **Family system** | `app/api/portal/family/*`; `app/api/admin/family-approvals/*`; `app/admin/family-approvals`; `components/portal/FamilyPageContent.tsx`; `components/admin/FamilyApprovalsClient.tsx`; `lib/family-utils.ts` | — | — | — | — | None. Tables dormant: Family, FamilyMembership, BoardApproval, FamilyMember _(inferred from schema)_ | |
| **Financial assistance** | `app/portal/assistance/*`; `app/api/portal/assistance/*`; `app/admin/assistance/*`; `app/api/admin/assistance/*`; `components/{portal,admin}/assistance/*` | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (shared with flyers/photos — keep) | `R2_*` (shared, keep) | — | Cloudflare R2 (documents) | None. Tables dormant: FinancialAssistanceApplication, AssistanceDocument, AssistanceDisbursement | |
| **Diagnosis verification** | `app/admin/verification`; `app/api/admin/verification/{patient,family}/*`; `components/admin/DiagnosisVerification*.tsx`; `components/portal/DiagnosisReminderBanner.tsx`, `components/portal/register/Diagnosis*` | — | — | — | R2 (letters) | None. Existing letters remain in R2 bucket; **do not delete the bucket objects** | |
| **Volunteers** | `app/admin/volunteers`; `app/api/admin/volunteers/*`; `app/api/portal/volunteer/*`; `app/api/volunteer-inquiry`; `app/portal/volunteer/*`; `components/admin/VolunteersClient.tsx`; `components/get-involved/Volunteer*`; `messages/Volunteer*.tsx` | `@react-email/*` (shared) | — | — | Resend (emails) | None. Tables dormant: VolunteerProfile/Application/EventAssignment/Timecard/TimecardRole | |
| **Sponsors** | `app/admin/sponsors`; `app/api/admin/sponsors/*`; `app/api/admin/events/[id]/{sponsors,sponsor-invite}`; `app/admin/events/[id]/sponsors`; `app/api/sponsor/*`; `app/api/sponsor-inquiry`; `app/(public)/sponsor-access/[token]`; `app/(public)/archive/sponsors`; `components/sponsor/*`; `components/get-involved/Sponsor*`; `components/admin/InviteSponsorButton.tsx` | — | — | — | Resend; R2 (logos) | None. Tables dormant: Sponsor, EventSponsor, SponsorAccessToken | |
| **Live events / polls / Q&A / Pusher** | `app/(public)/events/[slug]/live`; `app/(public)/event-polls/[token]`; `app/api/events/[id]/{live-state,polls,questions,announcements,itinerary,live-photos}`; `app/api/admin/{polls,questions}/*`; `app/api/admin/events/[id]/{polls,questions}`; `app/api/polls/create`; `app/admin/events/[id]/{polls,questions,announcements,itinerary}`; `components/events/live/*`; `components/{polls,event-polls}/*`; `components/admin/{polls,questions,announcements,itinerary}/*`; `lib/pusher-*.ts`; `lib/itinerary-status.tsx` | `pusher`, `pusher-js` | `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | — | Pusher Channels app | Re-add the 6 env vars in Vercel + `.env`. Tables dormant: Poll*, EventQuestion, EventAnnouncement, EventItineraryItem, PollCreationToken | |
| **Presenter / CloudConvert** | `app/(public)/presenter/[token]`; `app/api/presenter/[token]/*`; `app/api/admin/events/presenter-invite`; `components/presenter/*`; `lib/cloudconvert.ts` | `cloudconvert` | `CLOUDCONVERT_API_KEY` | — | CloudConvert (slides → images) | Re-add API key. Tables dormant: PresenterAccessToken, EventPresentation | |
| **Newsletter + crons** | `app/(public)/newsletter/*`; `app/admin/newsletter/*`; `app/api/admin/newsletter/*`; `app/api/cron/newsletter`; `app/api/unsubscribe` + `(public)/unsubscribe`; `components/admin/newsletter/*`; `components/home/NewsletterSignup.tsx`; `lib/newsletter-generator.ts`, `lib/unsubscribe-token.ts` _(inferred)_; photo/poll/question `…/newsletter/route.ts` selectors | `@react-email/*` (shared) | `CRON_SECRET` (shared), `EMAIL_FROM` (shared) | `vercel.json`: `/api/cron/newsletter` `0 9 1 * *`. **`/api/cron/send-reminders` `0 14 * * *` — event reminders, may be KEPT; decide in Phase 2** _(inferred)_ | Resend | Restore `vercel.json` cron entry. Table dormant: Newsletter | |
| **Gmail send-as** | `app/api/auth/gmail/*`; `app/api/admin/gmail/send`; `components/admin/Gmail*.tsx`; `lib/gmail-oauth.ts`, `lib/gmail-crypto.ts` | `googleapis` | `GOOGLE_GMAIL_CLIENT_ID`, `GOOGLE_GMAIL_CLIENT_SECRET`, `GOOGLE_GMAIL_REDIRECT_URI`, `GMAIL_TOKEN_ENCRYPTION_KEY` | — | Google Cloud OAuth client (Gmail API) | Keep the OAuth client + redirect URI in Google Cloud Console; each board member must re-authorize. Stored tokens are encrypted with `GMAIL_TOKEN_ENCRYPTION_KEY` — **keep that key or they're unreadable** _(inferred where tokens are stored)_ | |
| **Minutes** | `app/admin/minutes/*`; `app/api/admin/minutes/*`; `app/(public)/minutes/*`; `components/admin/minutes/*` | — | — | — | — | None. Table dormant: BoardMinutes | |
| **Tax filings** | `app/api/admin/archive/tax-filings`; tax-filings section of `app/admin/archive`, `app/(public)/archive/financials` _(inferred)_ | — | — | — | R2 (PDFs) _(inferred)_ | None. Table dormant: TaxFiling | |
| **Annual reports** | `app/api/admin/archive/annual-reports/*`; reports section of `app/admin/archive`, `app/(public)/archive/*` _(inferred)_ | — | — | — | R2 _(inferred)_ | None. Table dormant: AnnualReport | |
| **Admin reports** | `app/admin/reports`; `components/admin/reports/*`; `components/admin/stats/*`; `app/admin/events/[id]/stats` _(inferred)_ | `recharts` (appears unused in `src/` — inferred) | — | — | — | None | |
| **Multi-step `/register`** | `app/(public)/register`; `app/api/patient/register`; `components/portal/register/*` (Consent, Diagnosis, FamilyMembers, Preferences, StepIndicator) | `@aws-sdk/client-s3` (shared) | `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` (address autocomplete, shared) | — | R2 (diagnosis letters); Google Places | None. **Replaced in Phase 2+ by the thin "Register for Information" form** — do not restore both at `/register` | |

## Deps that look unused in `src/` _(inferred; not touched in Phase 1)_

`socket.io`, `socket.io-client`, `iron-session`, `jose`, `bcryptjs`, `recharts`, `qrcode.react`, `react-email`, `@aws-sdk/client-sesv2`. Candidates for removal, but removing deps needs the same revert path — check `git grep` first.

## Shared env vars that stay (not cut-specific)

`NEXT_PUBLIC_BASE_URL`, `R2_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `DEEPL_API_KEY`, `CRON_SECRET`, `ADMIN_NOTIFY_EMAIL`, Auth0 vars (`AUTH0_*`, read by the SDK, not via `process.env` in `src/`).
