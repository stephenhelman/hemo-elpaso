# Portal audit: what the removed patient portal was, and what to rebuild

Prepared 2026-11-23 from `main` at `5a6f615` and the pre-overhaul snapshot (tag `full-app-2026-11` → commit `a0f5569`, branch `archive/full-app`). **Read-only audit: no application code, branch, or database was touched.** Nothing below was run; it is from reading code and docs.

What I could **not** see: the Auth0 dashboard (applications, connections, Actions actually deployed), the production database contents, and the R2 bucket settings. Anything about those is marked *unverified*.

Paths are relative to `src/` unless they start with `docs/` or `prisma/`. "Archive" means commit `a0f5569`. Read any archived file with `git show a0f5569:src/<path>`.

---

## 1. Branch and commit inventory

### 1.1 Branches

There are **no unmerged branches**. Every local and remote branch is an ancestor of `main` (0 commits ahead). Branches are 0 to 174 commits behind `main` and are stale pointers, safe to delete whenever you like.

| Group | Branches | Last commit | Ahead / behind main |
| --- | --- | --- | --- |
| Snapshot | `archive/full-app` (local + origin), tag `full-app-2026-11` | 2026-03-23 | 0 / 174 |
| Cuts (all merged, `--no-ff`) | `cut/admin-reports`, `admin-trim`, `family-system`, `financial-assistance`, `gmail`, `governance-docs`, `live-events`, `newsletter`, `patient-portal`, `presenter`, `register`, `sponsors`, `verification`, `volunteers` | 2026-11-13 | 0 / 128 to 167 |
| Phase 1 to 5 features and fixes | 14 `chore/*`, `docs/*`, `feat/*`, `fix/*`, `prep/*`, `phase1/*` groups (about 50 branches) | 2026-11-13 to 2026-11-23 | 0 / 1 to 172 |
| `main` / `origin/main` | | 2026-11-23 | 0 / 0 |

All commits are by Stephen Helman. Three oddities:

- A ref literally named `origin` exists (shows in `git for-each-ref` as `origin`, pointing at `main`'s tip). It looks like `refs/remotes/origin/HEAD`. Harmless.
- `origin/feat/gallery`, `origin/feat/sponsors`, `origin/fix/phone-number` exist on the remote. All merged.
- `feat/sponsors` (merged 2026-11-15) is a **new** sponsors feature added *after* `cut/sponsors`. Not portal-related.

So there is nothing to rescue from an unmerged branch. All the removed code lives in the archive snapshot and in the cut commits below.

### 1.2 Commits on `main` that removed portal features

Each cut was a branch merged `--no-ff`; the merge SHA is the one to use with `git revert -m 1`. The "cut commit" is the one holding the deletions (restore single files from `<cut commit>^`).

| Feature | Cut commit | Merge SHA | Date | Message | Removed |
| --- | --- | --- | --- | --- | --- |
| Patient portal | `45bc815` | `7a4cbb9` | 2026-11-13 | remove patient portal (/portal, /api/patient/profile, /api/rsvp, /api/user/{role,permissions}, portal components) | `app/portal/{dashboard,events,profile,layout}`, `api/patient/profile`, `api/rsvp`, `api/user/{role,permissions}`, `components/portal/*`, `PortalMobileNav`, `PermissionGate`, `types/family.ts` (17 files) |
| Family system | `af8c959` | `ee38356` | 2026-11-13 | remove family system | `app/portal/family`, `api/portal/family/*`, `api/patient/family-members*`, `admin/family-approvals`, `lib/family-utils.ts`, `FamilyMemberInvite` email (13 files) |
| Diagnosis verification | `fc94ef5` | `f907187` | 2026-11-13 | remove diagnosis-letter verification and grace-period logic | `admin/verification`, `api/admin/verification/{patient,family}/[id]`, `DiagnosisVerification*`, `DiagnosisReminderBanner` (4 deleted, others edited) |
| Financial assistance | `e21f864` | `6767f28` | 2026-11-13 | remove financial assistance (portal, admin, disbursements, documents, emails) | `app/portal/assistance/*`, `app/admin/assistance/*`, `api/portal/assistance/*`, `api/admin/assistance/*`, 4 emails, translations (21 files) |
| Multi-step `/register` | `274a05b` | `a56015a` | 2026-11-13 | remove multi-step /register and /api/patient/register | `(public)/register`, `api/patient/register`, `components/portal/register/*` (Basic, Consent, Diagnosis, Emergency, FamilyMembers, Preferences), `lib/ensure-patient.ts` (11 files) |
| Live events / polls / Q&A / Pusher | `de3e9f9` | `b8fd599` | 2026-11-13 | remove live events, polls, Q&A, announcements, itinerary, live photos, Pusher | `(public)/events/[slug]/live`, `event-polls/[token]`, `api/events/[id]/{live-state,polls,questions,announcements,itinerary,live-photos,access-qr}`, `api/admin/{polls,questions}`, `api/polls/create`, `components/events/live/*` (21+ files) |
| Presenter | (in `cut/presenter`) | `5b426fc` | 2026-11-13 | | `(public)/presenter/[token]`, `api/presenter/[token]/*`, `lib/cloudconvert.ts` |
| Sponsors (old) | `eb7cf03` | `31af590` | 2026-11-13 | remove sponsors | access tokens, sponsor check-in, inquiry, admin, event sponsors |
| Volunteers | `ac4da56` | `b13f5f1` | 2026-11-13 | remove volunteers | `app/portal/volunteer/*`, `api/portal/volunteer/*`, admin, inquiry, 4 emails |
| Newsletter + crons | `59c0f2b` | `84fa960` | 2026-11-13 | remove newsletter (admin, generator, public archive, cron) | `(public)/newsletter`, `admin/newsletter`, `api/admin/newsletter/*`, `api/cron/newsletter`, `lib/newsletter-generator.ts`, 2 emails, `vercel.json` cron |
| Admin trim | `8d478c5` | `f9a6c84` | 2026-11-13 | admin trim: email templates, dead links, login returnTo=/admin | `translation/portal*.ts`, `WelcomeEmail`, `outsideRepTranslation`; `/admin` redirect added; `UserMenu` rewritten |
| Governance docs | `391786c` | `4573b94` | 2026-11-13 | remove public minutes/archive | minutes, annual reports, tax filings, scholarship records |
| Gmail send-as | (in `cut/gmail`) | `7ee8633` | 2026-11-13 | | `lib/gmail-*`, `api/auth/gmail/*` |
| Auth lockdown (not a cut) | | `1ea6745` | 2026-11-13 | `phase1/auth-lockdown` | **added** `middleware.ts`, `/api/session/board-check`; this is what ended patient access to the app |
| Dep cleanup | | `5230281` | 2026-11-13 | 21 npm packages removed (`pusher`, `pusher-js`, `jose`, `iron-session`, `zod`, `qrcode.react`…) | Reinstall per feature when restoring |

`docs/overhaul/RESTORE.md` already holds these merge SHAs, env vars and out-of-repo steps per feature. This audit adds *how each worked* and *what to reuse*.

**Restoring is not a clean option.** The cut code was written against the old `Patient` + `FamilyMembership` model. Reverting any of these merges today would conflict with the household model (Section 2, "Fit"). Treat the archive as a reference to port from, not code to revert.

---

## 2. How each removed feature worked

State key: **complete** (worked end to end), **partial** (works with gaps), **stub** (UI or route with no working backend).

### 2.1 Family authentication

- **One Auth0 application, one tenant.** `api/auth/[auth0]/route.ts` was just `handleAuth()` from `@auth0/nextjs-auth0` v3.8. The SDK reads `AUTH0_*` env vars. No custom connections, claims or roles in the code; sign-in method (database, Google, etc.) was whatever the tenant had enabled. *Which* connections were on is **unverified** (dashboard).
- **No middleware in the archive.** Protection was per-page: `app/portal/layout.tsx` called `getSession()` and redirected to `/api/auth/login?returnTo=/portal/dashboard`. API routes each called `getSession()` themselves. `middleware.ts` only arrived with `phase1/auth-lockdown`.
- **First-login linking:** `lib/ensure-patient.ts` `ensurePatientExists(auth0Id, email)`. If no `Patient` had that `auth0Id`, it created a stub (`role: "patient"`, language `en`, no profile). Link key was the Auth0 `sub`, not email. The portal layout then redirected to `/register` if `registrationCompletedAt` was empty and there was no `contactProfile` (legacy users excepted).
- **Session handling:** the SDK's encrypted cookie `appSession` (stateless, Auth0 default). `lib/auth.ts` and `UserMenu` read it through `useUser()` (client) and `getSession()` (server).
- **Post-Login Action:** the archive had none in the repo. `docs/overhaul/auth0-board-action.js` is a **draft, written during the overhaul, "NOT APPLIED"** (per its header): it denies every login whose verified email is not in a `BOARD_ALLOWLIST` secret. It does not treat families differently; it blocks them. Whether it is now deployed is **unverified**. RESTORE.md says restoring the portal means removing it or adding patients.
- **Today:** `Patient.auth0Id` is nullable. `lib/board/link-session.ts` links an invited board row to an Auth0 session by **verified email**, but only for rows with role `board`/`admin` (patient rows are explicitly unlinkable). `api/auth/[auth0]/route.ts` now redirects denied logins to `/access-denied`.
- **State:** complete. **Fit:** keep the linking idea; the lookup key must change (see 4 and 5).

### 2.2 The board/family portal switch

This was simple and has no equivalent today.

- **What identified someone as both:** `Patient.role` (a plain string: `patient` | `board` | `admin`) on the *same* `Patient` row as their family record. A board member was a patient who also had `role = "board"` and one or more `BoardRole` rows (`PRESIDENT`, etc.). There was one Auth0 identity and one session for both.
- **The switch:** `components/layout/UserMenu.tsx` (the nav avatar dropdown). It called `GET /api/user/role` (returns `{role}` from the `Patient` row; defaults to `"patient"` on any error or no session). The menu always showed a "Portal" link to `/portal/dashboard`. If `role` was `admin` or `board`, it also showed a purple "Admin dashboard" link to `/admin/dashboard`. Logout was `/api/auth/logout`. No re-login, no second session: just two links under one session.
- **Access checks:** portal side checked only "has a session" and "has a Patient row". Admin side checked `getAdminWithPermissions()` / `requirePermission("canX")` from `lib/permissions.ts` in each page and API route (about 50 admin API files imported it). **Two admin API files in the archive, `api/admin/verification/patient/[id]` and `api/admin/assistance/[id]/review`, call `requirePermission` without importing it.** That is a `ReferenceError` swallowed by their `try/catch` (500), so approving a diagnosis or reviewing an application would have failed. I did not run it, so treat as likely. This is evidence the verification and assistance admin paths were not well exercised.
- **Today:** `UserMenu` is login-only. Admin is gated by `middleware.ts` (calls `/api/session/board-check`, which requires `role ∈ {board, admin}` and optionally a permission) plus per-route `requirePermission()`.
- **State:** complete. **Fit:** the *model* ("one person, one identity, role flag") is what the new design replaces with an explicit portal claim (Section 4).

### 2.3 Patient profile

Collected at `/register` (6 steps) and editable at `/portal/profile` (`ProfileEditForm`, `PATCH /api/patient/profile`).

- **ContactProfile:** first and last name, phone, date of birth, address line 1/2, city, state, ZIP.
- **Patient root:** emergency contact name, phone, relationship; `preferredLanguage`; `wantsToVolunteer`; consent flags `consentToContact`, `consentToPhotos`, `consentDate`; `registrationCompletedAt`.
- **DisorderProfile** (only if the patient has a condition): `condition`, `severity`, `dateOfDiagnosis`, `treatingPhysician`, `specialtyPharmacy`, plus the letter fields (2.4).
- **PatientPreferences:** `interestedTopics`, `preferredEventTimes`, `maxTravelDistance`, `dietaryRestrictions`, `accessibilityNeeds`, `emailNotifications`, `smsNotifications`.
- **FamilyMember** (old, pre-Family model): `relationship`, `hasBleedingDisorder`, own `ContactProfile` and `DisorderProfile`, `migrationEligibleAt` (DOB + 18).
- **Self-editable:** all of the above except verification fields. The profile PATCH **upserted the whole disorder profile**, so a patient could change their condition after verification and it stayed verified (the update did not reset `diagnosisVerified`). A gap, not a feature to port.
- **Relation to old `Patient`:** profile data hung off `Patient` through four 1:1 child tables. The overhaul's thin model keeps `Patient` but moves to `Patient` + `HouseholdMember[]` with `statedDiagnoses` / `primaryDiagnoses` arrays (see Fit below).
- **State:** complete.

### 2.4 Diagnosis-letter verification

- **Upload flow:** the letter was uploaded **only during registration** as a multipart field `diagnosisLetter` posted to `POST /api/patient/register`. Rules: patient must have a condition; PDF/JPEG/PNG; 10 MB. The standalone component `DiagnosisUpload.tsx` posts to `/api/portal/diagnosis/upload`, **a route that does not exist anywhere in the archive**. So re-upload after registration (including from the reminder banner and for family members) was a **stub**.
- **Storage:** Cloudflare R2, the same bucket and credentials as photos and flyers (`R2_BUCKET_NAME`, `R2_*`). Key `diagnosis/patient/<patientId>/<random-32-hex>.<ext>` (Prefix `diagnosis/patient/`). Uploaded with `PutObjectCommand`, **no per-object ACL, no SSE option set** (R2 encrypts at rest by default). The row stored `diagnosisLetterUrl = R2_PUBLIC_URL/<key>` — a **public-style URL** — and `diagnosisLetterKey`. Whether the bucket serves that URL publicly is **unverified**; docs/legal/DATA_INVENTORY.md already flags the same bucket-visibility doubt for `photos-pending/`. If it is public, any letter was readable by anyone holding the link. Treat as a risk until checked.
- **Family letters:** `FamilyMembership.diagnosisLetterUrl/Key` columns existed, but I found no write path and no `diagnosis/family/` key anywhere. Family-member letters were never actually uploadable.
- **Review queue:** `/admin/verification` (`DiagnosisVerificationList`). Lists disorder profiles with a letter URL and `diagnosisVerified = false`, newest upload first, plus a second list: unverified, **no letter**, grace period ending soon.
- **Who could approve:** `requirePermission("canViewPHI")` → President, VP, Secretary, Treasurer (+admin). Today `canViewPHI` is the same set; the privacy policy says health information is visible only to President and VP, which does not match (a policy/permission mismatch to resolve, Question 5).
- **What approval recorded:** `DisorderProfile.diagnosisVerified = true`, `diagnosisVerifiedBy` (**taken from the request body, not the session**), `diagnosisVerifiedAt`; on denial `diagnosisRejectedReason`. `AuditLog` row `DIAGNOSIS_APPROVED` / `_REJECTED` with `details` containing the person's **name**. A `TODO: Send email notification to patient` was never done.
- **60-day deadline:** `ensure-patient.ts` `calculateGracePeriodEnd(patientHasCondition, familyHasCondition)` = now + 60 days, null if no condition anywhere in the family. Stored as `Patient.diagnosisGracePeriodEndsAt` and `diagnosisGracePeriodSource` (`self`|`family`). A *second*, different clock existed for families: `lib/family-utils.ts getFamilyRestrictionStatus` blocked when any active `FamilyMembership` had a condition, was unverified, and was **created more than 60 days ago** (the member's `createdAt`, not the Patient grace date).
- **What it blocked:** after the 60 days with no verification, `POST /api/rsvp` and `POST /api/portal/assistance` returned 403 `VERIFICATION_REQUIRED` (and `FAMILY_RESTRICTED` for the family clock). Nothing else was blocked: the portal itself, profile, events listing all still worked.
- **Expiry and reminders:** verification never expired (`diagnosisVerified` boolean, no expiry date). Reminders were **a banner only** (`DiagnosisReminderBanner`, shown in the portal layout: amber, red at ≤7 days, "pending review" if uploaded, "expired" after). **No email and no cron touched the grace period** (`api/cron/send-reminders` is event reminders only).
- **State:** partial. Single-person upload at registration worked; family and re-upload were stubs; admin approve route likely broken; no reminders by email.
- **Fit:** conflicts with the published policy and the thin model in four ways:
  1. The policy says health information is only *stated* and the app never puts diagnosis in emails, URLs or QR codes. Storing letters = collecting documents the policy does not list (Section 5.2 proposes the safe version).
  2. Policy: "Auth0: Board member sign-in" — families signing in changes the provider table and consent text.
  3. `Patient.diagnosisGracePeriodEndsAt`/`Source` still exist (dormant) but are never written.
  4. Gating RSVP on verification would break the current public RSVP via `/rsvp/[token]`, which needs no account (`lib/rsvp/eligibility.ts` is the current rule set; I did not read it in depth).

### 2.5 My Events

- `/portal/events` (`PortalEventsContent`) and `/portal/dashboard` (`DashboardContent`, `UpcomingEventCard`, `RecommendedEventCard`, `ActivityItem`, `LiveEventBanner`).
- Data came from `prisma.rsvp.findMany({ patientId, event: { eventDate ≥ now, status: "published" } })` with RSVP counts; "recommended" = published, upcoming, not already RSVP'd (and the picker included the family's active `FamilyMembership` rows).
- Actions: RSVP via `RsvpModal` (attendee count, family members, dietary, accessibility) → `POST /api/rsvp`; `QrCodeDisplay` showed a check-in QR.
- **State:** complete for upcoming only; **no past-event history view** (it filtered `eventDate ≥ now`).
- **Fit:** superseded. RSVPs are now token-based (`/rsvp/[token]`, `lib/rsvp/*`, `RsvpAttendee` rows tied to `HouseholdMember`). A rebuilt "My Events" is a read model over `Rsvp` + `RsvpAttendee` for the household, plus the same actions through `lib/rsvp`. Do not restore `/api/rsvp`.

### 2.6 Assistance and scholarship applications

**Financial assistance** (patient portal + admin):

- **Form fields:** `assistanceType` (`EVENT_FEES`, `TRANSPORTATION`, `MEDICATION`, `MEDICAL_EQUIPMENT`, `EMERGENCY_SUPPORT`, `OTHER`), `requestedAmount` (Decimal 10,2), `purpose` (required), `description`, status `DRAFT` or `SUBMITTED`; supporting documents uploaded to R2 (`AssistanceDocument`: fileName, URL, key, size, mime, description, `uploadedBy` = patient email).
- **Eligibility:** a patient with a condition needed verification OR to still be inside the 60-day grace; plus the family restriction. Patients without a condition were never blocked. So **verification was required after day 60**, not at the start.
- **Review steps:** statuses `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED | DENIED → DISBURSED → CLOSED`. Admin `PATCH /api/admin/assistance/[id]/review`, permission `canApproveAssistance`, actions APPROVE (needs `approvedAmount > 0`) or DENY; records `reviewedBy` (**from the body**), `reviewedAt`, `reviewNotes`, `approvedAmount`; audit entry names the patient; email `ASSISTANCE_APPROVED`/`_DENIED`.
- **Payments:** `AssistanceDisbursement` (amount, `paymentMethod` CHECK|CASH|REIMBURSEMENT, `checkNumber`, `issueDate`, `cashedDate`, status PENDING|ISSUED|CASHED|VOID, `issuedBy`, notes, proof-of-payment scan in R2 at `assistance/disbursements/<applicationId>/…`). Email `DISBURSEMENT_ISSUED`.
- **Documents:** R2 prefix `assistance/<applicationId>/<uuid>.<ext>`; patients could view and delete their own.
- **Emails:** `ASSISTANCE_SUBMITTED`, `_APPROVED`, `_DENIED`, `DISBURSEMENT_ISSUED` (React Email + DB-editable templates).
- **State:** mostly complete; admin review route likely broken by the missing import (2.2).

**Scholarships:** *not* a portal application. `Scholarship` was an admin "archive" record (past recipients) removed with governance docs, and the public `/scholarships` page is now Sanity-driven information. There was **no scholarship application form** in the portal. If you want one, it is new work, not a restore.

- **Fit:** financial assistance involves money and financial/health-adjacent documents the policy does not cover; needs legal review before rebuild (Question 7). Dormant tables hold the shape: `financial_assistance_applications`, `assistance_documents`, `assistance_disbursements`.

### 2.7 Live events (polls, Q&A, live pages, sponsor screens)

- **Live page:** `/events/[slug]/live` required an Auth0 session **or** a sponsor `?session=` token (from the sponsor check-in). Server-loaded `event` with presentation, itinerary, active announcements, active polls with options and responses, questions, approved photos. Client `LiveEventTabs`; `GET /api/events/[id]/live-state` returned the same JSON for refresh.
- **Realtime:** Pusher Channels (`lib/pusher-client.ts`, server `pusher`), env `PUSHER_*` and `NEXT_PUBLIC_PUSHER_*`. Removed with the deps.
- **Polls:** admin-created or created by an outside rep via `PollCreationToken` (`POST /api/polls/create`, token + eventId + expiry), board approval (`/api/admin/polls/[id]/approve`), toggle active, voting `POST /api/events/[id]/polls/[pollId]/vote`.
- **Q&A:** `EventQuestion` with upvotes, answered by admin or presenter; "send to newsletter" selectors.
- **Announcements / itinerary:** `EventAnnouncement`, `EventItineraryItem` (admin CRUD + presenter status updates).
- **Presenter and sponsor screens:** `/presenter/[token]` and `api/presenter/[token]/*` (slides converted via CloudConvert), `/sponsor-access/[token]`, sponsor check-in, `/event-polls/[token]` for sponsor reps.
- **State:** complete but large. **Fit:** none of it fits the thin household model; access was session-or-token-based on a family identity. Treat as a separate product decision (Question 9).

### 2.8 Newsletter and bulk email

- **Newsletter:** monthly cron `/api/cron/newsletter` (`0 9 1 * *`, `Bearer CRON_SECRET`) called `createNewsletterDraft(month, year, "cron")` in `lib/newsletter-generator.ts` and emailed the President (`NewsletterDraftReady`). Draft in `Newsletter` (`generatedContentJson`, bilingual president message, status DRAFT→APPROVED/REJECTED→SENT, revision notes). Admin UI to review/approve/reject/regenerate; public archive `/newsletter`. Content was assembled from events, approved photos, and board-selected polls/Q&A. **No AI/LLM calls** (I grepped the generator for Anthropic/OpenAI; none). The send to recipients was `MemberNewsletter` email.
- **Bulk email:** the permissions `canSendBulkEmails`, `canSendIndividualEmails` still exist in `lib/permissions.ts` but I found no bulk send route in the current tree. The only bulk sender today is invitations (`lib/invitations/send.ts`, count confirmation, consent and opt-out rechecked at send time, `emailOptOut`).
- **Kept:** `/api/unsubscribe`, `(public)/unsubscribe`, `lib/unsubscribe-token.ts` (now sets `Patient.emailOptOut`).
- **State:** newsletter complete; bulk email stub (permissions only).
- **Fit:** a newsletter needs its own `newsletter` consent type (today there are only `data_and_contact`, `media`, `age_guardian_attestation`). Anything marketing-like is "non-essential" under `lib/email/policy.ts` and is blocked after withdrawal.

### 2.9 Other portal-related things not on your list

- **Volunteers** (`/portal/volunteer`, volunteer check-in/timecards with `VolunteerTimecard`, volunteer emails). Cut. Dormant tables remain.
- **Sponsors**: old token-based sponsor portal cut; a new sponsors feature (`feat/sponsors`) is live and separate.
- **Board onboarding / Gmail send-as:** board-only, not portal.
- **Welcome email:** `WelcomeEmail` deleted; linked to `/portal/*`.
- **Check-in:** old portal-linked check-in (family membership ids, session tokens) replaced by `feat/checkin` (QR token → RSVP). `Rsvp.familyMembershipIds`, `CheckIn.familyMembershipIds`, `CheckIn.sessionToken/sessionExpiresAt` columns remain and are still required (non-null) on `CheckIn`.
- **Contact routing:** `lib/contact-routing.ts` is superseded by `EmailRoute` (`feat/email-routing-settings`).
- **Language preference** was on `Patient.preferredLanguage` (still used).
- **Admin "users" directory** was replaced by `/admin/patients`.

### 2.10 Fit with the current setup (summary)

| Current constraint | What it means for a rebuilt portal |
| --- | --- |
| **Household model** (`Patient` = primary adult, `HouseholdMember[]` with `ageGroup`, `statedDiagnoses`, `status`) | Portal identity = the primary `Patient`. Members are not accounts. No `Family`/`FamilyMembership`/`FamilyMember` (dormant, do not use). |
| **Consent v2** (`ConsentRecord`: `data_and_contact`, `media`, `age_guardian_attestation`; append-only, UPDATE-reject trigger; `textVersion`, `method`) | Editing consent in the portal = new `ConsentRecord` rows, never an update. Needs new types for anything new (SMS, newsletter, verification). Method value for portal edits is a new string (`portal`). |
| **Published privacy policy** (`/privacy`, `src/content/legal`) | Lists Auth0 as "Board member sign-in" only; says board members sign in, and health info visible only to President/VP; Twilio is not a listed provider; a stored letter is not a listed data category; retention table has no row for letters or verification results. **Each of these needs a policy and `textVersion` change before launch.** |
| **Attendee contact limits** (`lib/attendee-contact.ts`: email and phone only for `canManageUsers`, i.e. President and VP, masked server-side) | Verification results and any new portal data must follow the same server-side masking. A family-side view of their own data is separate and fine. |
| **Never PHI in emails, URLs, QR payloads, logs, client code for unauthenticated users** (CLAUDE.md rule 4) | Magic links and verification emails cannot mention diagnosis or letter status wording that implies one ("verify your diagnosis"). Use neutral wording. |
| **Board-only Auth0 + `middleware.ts` gating `/admin`** | `auth0Id` is currently board-only by convention. Families would need a second path (Section 4). |
| **`/rsvp/[token]` works with no account** | The portal must stay optional. RSVP must not require an account or verification. |

---

## 3. Data and storage left over

### 3.1 Prisma models (all still in `schema.prisma`; no table was ever dropped)

**Still present (dormant, not read by current code unless noted):**

| Area | Models / columns |
| --- | --- |
| Profile | `ContactProfile` (**used**: phone etc.), `DisorderProfile` (letter and verification columns), `PatientPreferences`, `FamilyMember` |
| Patient columns | `emergencyContact*`, `wantsToVolunteer`, `volunteerRequestedAt`, `diagnosisGracePeriodEndsAt`, `diagnosisGracePeriodSource`, `consentToContact/Photos/Date` (superseded by `ConsentRecord`), `registrationCompletedAt` |
| Family | `Family`, `FamilyMembership` (incl. its own letter and verification columns), `BoardApproval`, enums `FamilyMembershipStatus`, `BoardApprovalType/Status`, `AgeTier` |
| Assistance | `FinancialAssistanceApplication`, `AssistanceDocument`, `AssistanceDisbursement`, enums `AssistanceType/Status`, `DisbursementStatus`, `PaymentMethod` |
| Live events | `Poll`, `PollOption`, `PollResponse`, `PollCreationToken`, `EventQuestion`, `EventAnnouncement`, `EventItineraryItem`, `PresenterAccessToken`, `EventPresentation` |
| Newsletter | `Newsletter`, `NewsletterStatus` |
| Volunteers / sponsors (old) | `VolunteerProfile/Application/EventAssignment/Timecard/TimecardRole`, `Sponsor`, `EventSponsor`, `SponsorAccessToken` (Sponsor is **reused** by the new sponsors feature) |
| Other | `BoardMinutes`, `AnnualReport`, `TaxFiling`, `Scholarship`, `CommunicationLog` |
| Enums | `AuditAction` still has all old values (`DIAGNOSIS_*`, `ASSISTANCE_*`, `FAMILY_*`, `POLL_*`, …), `EmailTemplateType` still has `ASSISTANCE_*`, `VOLUNTEER_*`, `WELCOME_EMAIL`, `FAMILY_MEMBER_INVITE`, etc. |

**Gone (never existed in the current schema; added after the archive):** nothing was removed. The *new* models in the current schema are `ConsentRecord`, `HouseholdMember`, `Invitation`, `RsvpAttendee`, `EmailRoute`. The `diff` of model and enum names between the archive and now shows exactly those five as additions and zero removals.

**Columns gone:** none (rule 1 of the overhaul rules). Columns made nullable: `patients.auth0Id`, `patients.email`.

**Still referenced by live code:** `ContactProfile.phone` (check-in, walk-in), `Patient.*` thin columns, `Rsvp`/`CheckIn` family columns (as required-but-empty), `Sponsor*` (new sponsors). I did not grep every reference; the rest is dormant per RESTORE.md. **Whether the dormant tables are empty in production is unverified** (DATA_INVENTORY.md item 8 asks the same).

### 3.2 R2 storage prefixes from these features (no object names listed)

| Prefix | Content | Pointed to by | Still referenced by live code? |
| --- | --- | --- | --- |
| `diagnosis/patient/<patientId>/` | Diagnosis letters | `disorder_profiles.diagnosisLetterUrl/Key` | No code reads it. DB rows (if any) still point to it. |
| `assistance/<applicationId>/` | Application documents (bills, prescriptions) | `assistance_documents.fileUrl/fileKey` | No |
| `assistance/disbursements/<applicationId>/` | Proof of payment scans | `assistance_disbursements.proofOfPaymentUrl/Key` | No |
| `sponsors/logos/` | Sponsor logos | `sponsors.logoUrl/Key` | Yes (new sponsors) |
| `tax-filings/<year>/` | Form 990 PDFs | `tax_filings.fileUrl/Key` | No |
| `events/<eventId>/live-photos/`, `events/<eventId>/slides/<lang>/` | Live photos, presentation slides | polls/presentation rows | No |
| `photos*/`, `flyers/`, `uploads/tmp/` | Photos and flyers | | Yes (not portal) |

RESTORE.md says "do not delete bucket objects"; DATA_INVENTORY.md flags retention of letters and assistance documents as a pending decision. **Nothing deletes or lifecycles any of these today.** If any real letters exist, they are retained indefinitely, which contradicts the policy's retention approach and is a priority to decide (Question 6).

---

## 4. Sign-in options for the rebuilt portal

### 4.0 What the code supports today

- `@auth0/nextjs-auth0` **3.8.0** (SDK v3, Pages/App Router `handleAuth`, `getSession`, edge `getSession`). One configured client, one cookie (`appSession`) per deploy by default.
- `Patient.auth0Id` nullable and unique; `linkPendingBoardMember` links by verified email, board roles only.
- `middleware.ts` gates `/admin` by `Patient.role`.
- Resend is wired (`lib/resend.ts`, `lib/email/send.ts` `sendLoggedEmail`, `lib/email/policy.ts`). Tokens (`lib/tokens.ts`: 32 random bytes, SHA-256 hashed in DB) already back RSVP and invitation links.
- **No Twilio or any SMS code or dependency** in `package.json` or `src`. No `jose`/`iron-session` (removed as unused).
- The household model already stores `Patient.email` (nullable) and `ContactProfile.phone`. There is **no unique phone** and no `phoneVerified` flag.
- Pricing and plan limits below come from my general knowledge of Auth0 and Twilio, **not from the repo or a live check**. Confirm on auth0.com/pricing and twilio.com/pricing before deciding.

### 4.1 Comparison

| | **A. Auth0, two apps (Board + Family), passwordless + social** | **B. Auth0, one app, roles** | **C. Own magic links + SMS codes (Resend + Twilio), no Auth0 for families** |
| --- | --- | --- | --- |
| **What exists** | SDK v3 can run two instances via `initAuth0({ session.cookie.name, routes, baseURL… })`; the current code uses the default singleton in ~50 places | Today's single app; `Patient.role` already distinguishes | Token, hashing, logged-email and consent-policy code exist. No session layer, no SMS |
| **Setup** | New Auth0 application (Regular Web App); Universal Login with Email (OTP/link) and SMS passwordless enabled; Google/Apple social; SMS needs Twilio credentials in Auth0; Actions per app; separate callback/logout URLs; second SDK instance with a different cookie name; new Action to keep families off the board app and board off... | Add roles, add connections; an Action adds a `portal` claim; the existing allow-list Action must change from "deny all non-board" to "allow all, tag board". Same SDK instance | Build: `family_sessions` table (hash, patient id, expiry, revoked), HttpOnly cookie, login-request table with rate limit, Twilio Verify or Messaging account, A2P 10DLC registration, Turnstile on request forms |
| **Cost drivers** | Auth0 MAU (families inflate MAU with every household; the free tier limit and which features it includes should be checked), SMS passwordless via Twilio per message plus Auth0 plan requirements, possible "enterprise-only" restrictions for multiple custom domains | As A for MAU; less config | Twilio per-SMS and Verify per-verification costs plus US carrier registration fees; Resend already paid. No MAU cost. Engineering time is the cost |
| **Phone UX** | Redirect to Auth0 hosted page and back (acceptable, one extra hop). SMS autofill works with a one-time-code input. Magic link opens the mail app's browser, which may be a different browser from where the user started (a known magic-link pain) | Same as A | Fully ours, so link-lands-in-the-right-browser can be fixed by a code-entry fallback and same-device continuation. Best control; worst if we get SMS wrong |
| **Household with only a phone number** | Works if SMS passwordless is enabled; Auth0 stores the number as the identity. `Patient.email` is nullable, so link by phone needs a new verified-phone field | Same | Natural: send a code to `ContactProfile.phone`; verify, then match the household |
| **Board ↔ family switch** | SSO: both apps share the tenant's Auth0 session cookie. Clicking "Board" runs `/authorize` for the Board app; Auth0 sees an existing session and returns silently without re-prompting (provided no `prompt=login`, same connection, and the Board Action allows the user). **Silent switch works.** Two app cookies, so a family session never carries admin access. If the same person used email OTP for family but the Board app wants a different connection or MFA, the Action can step up, which prompts. | One cookie: simplest switch (a menu link, as in the archive), but one session proves both; a bug in role checks leaks board access | No Auth0 SSO, so a board member who is also a family signs in **twice** (once to Auth0 for `/admin`, once with our link for `/portal`), unless the family login also accepts an active Auth0 board session |
| **Activity log: family vs board** | Auth0 `aud`/`client_id` per app plus a `portal` claim → log `actorType: "family" \| "board"`. Clean | Needs the claim; still one `sub`. Risk of mis-tagging | We set `actorType` ourselves in each session; clean, but no Auth0 logs for family |
| **Risks** | Two SDK instances is the least-trodden path in SDK v3 (global singleton, `getSession` imported everywhere). MAU growth. Auth0 ownership of family PII (email, phone) which the privacy policy must list | Weakest isolation. Board/family blur in the log. Existing Action must be rewritten; the gate that keeps `/admin` safe today (allow-list) gets weaker | We own every security property: replay, enumeration, SMS pumping/toll fraud, rate limits, session fixation. Highest security work |
| **Policy impact** | Auth0 listed for families too; add Twilio if SMS | Same | Add Twilio; drop nothing |

### 4.2 Recommendation

**Option A, but staged: start with email magic link only, add SMS after the email path ships.** Reasons:

1. **Isolation is what your policy promises.** Board sessions and family sessions are separate cookies with separate client IDs. A mistake in a family route cannot hand out board access, and the board gate (`middleware.ts` + allow-list) stays as it is. Option B weakens exactly that.
2. **The switch is free with Auth0 SSO.** The Board and Family apps share one Auth0 session, so one person on the board *and* in a family moves between portals without a second login, which is the behavior you described from the old nav.
3. **You do not build credential security.** C means owning replay, rate limits and SMS fraud. For a nonprofit with a small team that is the wrong place to spend risk, and SMS toll fraud is a real cost threat. Auth0 or Twilio Verify handles that.
4. **Phone-only households** are the reason to include SMS, but they are probably a minority and can be handled in phase 2 (or by a board-assisted path: a board member sends them a one-time link). Starting email-only keeps phase 1 shippable and avoids the carrier registration lead time.
5. **Caveats to verify before committing:** (a) that SDK v3 two-instance setup works with your `middleware.ts` edge `getSession` and ~50 imports (this is the biggest technical unknown, so prototype it first); (b) Auth0 plan limits on passwordless and SMS and MAU price; (c) how an Auth0 `sub` is matched to a household when the email changes.

If (a) fails the prototype, the fallback is **C for email magic links only** (build the small session layer ourselves, reusing `lib/tokens.ts`) while keeping Auth0 for the board. That is cheap because the token pattern already exists. Add SMS (via Twilio Verify) later in either path.

**Identity match rule (all options):** link by **verified contact** (email or phone) to `Patient`, never by name; refuse if more than one `Patient` matches (`possibleDuplicateOfId` already flags duplicates, and `email` is not unique). Rows with role `patient` must be linkable in the family app only; keep the existing rule that board-link never claims a patient row.

---

## 5. Rebuild plan (proposal only)

### 5.1 Port, rewrite or drop

| Feature | Decision | Why |
| --- | --- | --- |
| Family authentication | **Rewrite** (new Family app / session), keep `ensure-patient` idea | Old model keyed on `sub` with auto-created stubs; new model must link to an *existing* household by verified contact and never create stubs silently |
| Board/family switch | **Rewrite** | Old: role flag in one session. New: two apps with SSO and an explicit portal claim. Reuse the `UserMenu` layout idea only |
| Patient profile | **Rewrite** | Old fields were per-person tables; new editing is on `Patient` + `HouseholdMember` through existing `lib/households/*` validators, with consent writes as new `ConsentRecord` rows. Port the `ProfileEditForm` UI shape, not the code |
| Diagnosis verification | **Rewrite** (smaller, different design in 5.2) | Old design stored the letter indefinitely, public URL, unreviewed admin routes, single-person only |
| 60-day deadline and gating | **Drop as default; make optional** | It gated RSVP and assistance. Current RSVP is account-free and must stay so. Gate only assistance if the board still wants it (Question 3) |
| My Events | **Rewrite** (small) | Read model over `Rsvp`/`RsvpAttendee`, actions via `lib/rsvp`. Add past events |
| Financial assistance | **Defer; rewrite if wanted** | Needs legal and board decisions; dormant tables can hold it. Port the status model and the disbursement shape later |
| Scholarship applications | **Drop** (never existed) | New work if wanted; schedule after assistance |
| Live events (polls, Q&A, Pusher) | **Drop for now** | Large, off-model, needs a realtime vendor and a family identity. Revisit as its own product |
| Newsletter | **Rewrite** as a messaging campaign with its own consent type | Old generator needed no consent model and had a cron-only trigger. Port the draft→approve flow idea |
| Bulk email | **Rewrite** via the messaging module (5.3) | Only permissions exist; invitations already prove the pattern (count confirm, consent recheck, opt-out) |
| Volunteers, sponsors portal, presenter | **Drop** | Outside the household portal scope |

### 5.2 Verification data model (store the result; delete the letter)

Principle: keep a **result**, not a document. The letter is received, reviewed, then **deleted from R2 on approval or rejection, and a short-TTL purge covers any left behind**. No diagnosis is ever put in an email, URL, QR or client-visible log.

New table (additive, **dev branch only** until reviewed):

```
verification_requests            (new table)
  id               uuid pk
  patientId        fk Patient
  subjectType      'patient' | 'household_member'
  householdMemberId fk HouseholdMember? (null if subject is the primary)
  claimedDiagnosis text   -- from DIAGNOSIS_VALUES; PHI, same protections as statedDiagnoses
  status           'pending' | 'approved' | 'rejected' | 'expired' | 'withdrawn'
  uploadKey        text?  -- R2 key of the letter; NULL after deletion
  uploadedAt       timestamptz
  reviewedByBoardUserId fk Patient?   -- from the SESSION, never from the request body
  reviewedAt       timestamptz?
  rejectionReasonCode text?           -- enum-like code, no free text
  verifiedOn       date?              -- the date the verification was done
  expiresAt        timestamptz?       -- null = never; set if the board wants periodic re-verification
  letterDeletedAt  timestamptz?
  createdAt, updatedAt
```

And a result on the existing records, derived rather than duplicated: a household member (or primary) is "verified for `<diagnosis>`" when the latest request for them is `approved` and `expiresAt` is null or in the future. Do **not** reuse `DisorderProfile` (dormant, carries physician/pharmacy and public-URL fields).

Rules:

- Upload to a **private** R2 prefix `verification/<requestId>/<uuid>` using a presigned PUT with a 10-minute expiry, content-type and size limits; never store a public URL; board views via short-lived presigned GET after a `canViewPHI` check, with an audit row.
- On approve or reject: in the same server action, delete the object, set `uploadKey = null`, `letterDeletedAt = now()`. A daily job (extend `/api/cron/retention`) deletes any object older than N days (propose 14) whose request is still pending or whose delete failed, and marks `expired`.
- Audit rows hold ids only (request id, action), and **no names or diagnoses** in `details` (the old audit rows had names).
- Who can review: decide in Question 5 (the policy says President and VP only; `canViewPHI` today includes Secretary and Treasurer).
- Policy updates required: a new row in "What we collect" and in the retention table ("diagnosis letter: until reviewed, at most N days; the result is kept while you are involved with HOEP"), and a new `verification` consent type with its own `textVersion`.

### 5.3 Where general-purpose modules would live

Keep them free of HOEP imports (no `Patient`, `Event`, or board permissions inside); HOEP code calls in through thin adapters. Proposed layout under `src/lib/` (or `src/modules/` if you prefer a stronger boundary):

```
src/modules/            (no imports from src/app or HOEP models)
  messaging/            channels (email, sms), templates, send(), delivery log, consent-policy hook
  verification/         request lifecycle, storage adapter, reviewer interface, purge
  automations/          trigger → condition → action runner, schedule store, dry-run
  activity-log/         append(event), actor {type: family|board|system, id}, query, retention
src/lib/hoep/           (HOEP-specific adapters)
  messaging-adapter.ts       maps Patient/consent → recipients, `lib/email/policy.ts` rules
  verification-adapter.ts    maps HouseholdMember/DIAGNOSIS_VALUES, permissions
  automations-config.ts      the reminder/expiry rules
  activity-adapter.ts        wraps AuditLog
```

- **Messaging:** wrap today's `lib/email/send.ts` and `lib/email/policy.ts`; add an SMS channel behind the same interface; the module takes "may I send this kind to this recipient" as an injected function.
- **Activity log:** `AuditLog` has `patientId` only as the actor and no actor type. Add `actorType` (additive migration, dev branch only) so family and board actions are distinguishable; backfill existing rows as `board`.
- **Automations:** reminders, verification purge and expiry, retention. Today these are three separate crons in `vercel.json`; the module is a runner those crons call.

### 5.4 Build order (each phase ships alone)

| Phase | Ships | Migration | Notes |
| --- | --- | --- | --- |
| 0. Decisions + policy | Answers to the questions below; policy and consent text drafts; attorney review of what changes | none | Needed before anything collects new data |
| 1. Activity log actor type | `actorType` on `AuditLog`; helper that all new code uses | **Additive column, dev branch only** | Needed so phase 2 can be audited correctly |
| 2. Family sign-in (email magic link) + read-only portal | `/portal` showing the household, upcoming/past RSVPs, consent status; second Auth0 app or fallback session layer; header switch for dual users | Possibly a `verified contact` field; **dev branch only** | Prototype the two-instance SDK first |
| 3. Self-service edits | Edit household details and consent through `lib/households` and new `ConsentRecord` rows; RSVP changes through `lib/rsvp` | none expected | Follow the append-only consent rule |
| 4. Verification | `verification_requests`, private upload, review queue, purge job | **New table, dev branch only** | Policy and consent text must be live first |
| 5. Phone sign-in | SMS passwordless / Twilio Verify; A2P registration; SMS consent type | **Possibly new consent type and phone-verified flag, dev branch only** | Start the carrier registration in phase 2 (lead time) |
| 6. Messaging module extraction + campaigns/newsletter | Move email code behind the module, add campaign sends with their own consent | consent type only | |
| 7. Assistance (if approved) | Application, review, disbursement on the dormant tables | none, or additive | Needs legal and board input |
| 8. Live events | Only if the board wants it | | Separate project |

All migrations must be **additive** (CLAUDE.md overhaul rule 1), created and tested on a dev branch/database only (`db:whoami` / `scripts/db-guard.ts` exist to stop dev commands hitting the production Neon endpoint), and merged with `--no-ff` per rule 2.

---

## 6. Questions for you

1. **Auth0 dashboard facts.** Which connections are enabled today (database, Google, passwordless)? Is `auth0-board-action.js` deployed, and is the `BOARD_ALLOWLIST` secret set? What Auth0 plan are you on? I could not see any of this.
2. **Are there real letters or assistance documents in R2 or the database?** Production dormant tables are "mock data only" per RESTORE.md, but the R2 bucket was not snapshotted. Is the bucket's public URL enabled for the whole bucket (the old letter URLs were public-style)? Decide whether to purge `diagnosis/`, `assistance/` before the rebuild.
3. **Should verification gate anything?** Old: after 60 days it blocked RSVP and assistance. Options: gate nothing (verification only unlocks assistance), gate assistance only, or restore the 60-day rule. This affects the account-free RSVP.
4. **Who is a portal user?** Only the primary adult, or can adult household members (who confirm by email or phone today) get their own login? I assumed primary only.
5. **Who may review letters?** Policy says President and VP; `canViewPHI` includes Secretary and Treasurer. Which is right, and which should change?
6. **Letter retention.** Delete immediately on decision (my recommendation) or keep for a short window (say 14 days) for appeals? And should a result ever expire?
7. **Assistance and scholarships:** do you want them rebuilt, and is there board policy on eligibility, amounts and who approves? Is a scholarship *application* wanted (it never existed)?
8. **SMS:** do you accept the carrier-registration lead time, ongoing per-message cost and an SMS consent type? Or is email-only plus board-assisted help for phone-only households enough for launch?
9. **Live events and newsletter:** drop, defer, or required for the rebuild?
10. **Attorney:** the privacy and children policies must change for family sign-in (Auth0 provider row, Twilio, new data category, retention). Do you want this batched with the existing `docs/legal/ATTORNEY_QUESTIONS.md`?
11. **Auth0 SDK:** are you willing to run a short spike (two `initAuth0` instances with middleware) before committing to option A? If it fails I will fall back to option C for email links.
12. **Duplicate households:** `Patient.email` is not unique. When a verified email matches several rows, should login refuse and ask the board to merge, or show a chooser?
