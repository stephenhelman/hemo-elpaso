# HOEP data inventory (input for the privacy policy)

Prepared 2026-11-19 from the code on `main` at `063afb5`. **Read-only audit: no application code was changed.**

**How to read this document**

- Everything marked with a file path was read in the code. Things that live in a dashboard (Neon, Resend, Vercel, Auth0, Cloudflare, DeepL, Sanity) cannot be seen from the repo; they are collected in [section 9](#9-things-to-verify-outside-the-code).
- "Health information" below means the stated bleeding-disorder diagnoses (`DIAGNOSIS_VALUES` in `src/lib/patients/diagnoses.ts`). Nothing else collected is clinical.
- Status of the data: `CLAUDE.md` says the app is **not yet deployed to production**, and `docs/overhaul/RESTORE.md` says the database holds mock data only. This inventory describes what the code will collect and keep once real people use it.
- Public sign-up (`/register-info`, public RSVP form) is **switched off** unless `REGISTRATION_OPEN=true` (`src/lib/registration.ts`). When it is off, the only way personal data enters is: board members add people by phone, invitation links, the contact form, and board invitations.
- Recommendations are collected in [section 8](#8-recommendations). They are proposals for Stephen and the board to decide, not changes already made.

---

## 1. Personal data collected

### 1a. Primary registrant ("Register for Information" and public RSVP form)

Form: `src/components/register-info/RegisterInfoForm.tsx` → `POST /api/register-info` (`src/app/api/register-info/route.ts`) and `POST /api/rsvp/public` (`src/app/api/rsvp/public/route.ts`, same fields plus who is attending). Validation: `validatePatientInput` in `src/lib/patients/create.ts`. Board "Add patient" (phone call-ins) uses the same validator: `POST /api/admin/patients`.

| Field | Required? | Health info? | Notes |
| --- | --- | --- | --- |
| First name | Required (max 100) | No | `contact_profiles.firstName` |
| Last name | Required (max 100) | No | `contact_profiles.lastName` |
| Email | Optional, but **email or phone is required** | No | Lower-cased and trimmed. `patients.email` |
| Phone | Optional (see above) | No | Normalized to `+1XXXXXXXXXX`. `contact_profiles.phone` |
| Address | Optional (max 300) | No | One free-text line, filled by Google Places autocomplete. `contact_profiles.addressLine1`. Not used by any feature other than display and CSV export |
| Preferred language (en/es) | Defaults to `en` | No | `patients.preferredLanguage` |
| Household size | Derived (1 + members, max 12) | No | `patients.familySize` |
| Own stated diagnoses | Optional checkboxes: hemophilia A, hemophilia B, von Willebrand, other bleeding disorder, carrier, family member/caregiver | **Yes** | Stored twice: `patients.primaryDiagnoses` (own) and `patients.statedDiagnoses` (household union, recomputed by `src/lib/households/sync.ts`) |
| "I am 18+ and guardian of any minors listed" | Required checkbox (web, when a household is entered) | No | Recorded as consent type `age_guardian_attestation` |
| Consent: store my info and contact me | Required | No | consent type `data_and_contact` |
| Consent: photos/video | Optional | No | consent type `media` |
| Honeypot field, Turnstile token | System | No | Used to reject bots, **not stored** |
| Derived/system: `source` (web/phone), `createdAt`, `possibleDuplicateOfId`, `emailOptOut`, `role` | System | No | Duplicate detection matches on email or phone (`findDuplicateRootId`) and only flags, never merges |

### 1b. Household members (entered by the primary)

Same forms; rules in `src/lib/households/members.ts`. Table `household_members`.

| Field | Required? | Health info? | Notes |
| --- | --- | --- | --- |
| First name | Required | No | |
| Last name | Optional | No | |
| Relationship (child, spouse/partner, parent, sibling, other) | Required | No | |
| Age group (0–5, 6–12, 13–17, 18+) | Required | No | No date of birth is collected anywhere |
| **Minors:** stated diagnoses | Optional | **Yes** | Entered by the parent/guardian |
| **Adults (18+):** email | Required unless "confirm by phone" is chosen | No | An email is sent to this adult (see section 6) |
| **Adults (18+):** `confirmByPhone` | Alternative to email | No | Board phones them instead |
| Status, confirm token hash, expiry, `confirmedAt` | System | No | `not_required` (minor), `pending`, `confirmed`, `declined`, `expired` |

The primary can never enter diagnoses for another adult (enforced in `validateMembers`).

### 1c. Adult household member confirming for themselves

Page `/confirm/[token]` (`src/app/(public)/confirm/[token]/page.tsx`) → `POST /api/confirm/[token]` (`src/lib/households/confirm.ts`).

| Field | Required? | Health info? |
| --- | --- | --- |
| First name | Required | No |
| Last name | Optional | No |
| Email | Optional | No |
| Own stated diagnoses | Optional | **Yes** |
| Consent: store my info and contact me | Required | No |
| Consent: photos/video | Optional | No |
| "I am 18 or older" | Required | No |

### 1d. RSVP, invitation and check-in data (primary and household)

| Field | Where | Whose | Required? | Health? |
| --- | --- | --- | --- | --- |
| Yes/no response, who is attending (checkboxes of household members), number of unnamed guests (max `MAX_GUESTS`) | `/rsvp/[token]` → `POST /api/rsvp/respond`; public RSVP form; board "Add RSVP" | Primary and listed household members | Yes/no required | No (but the event itself may imply a diagnosis, see section 8) |
| `rsvps`: party size, guest count, source (invite/public/manual), `cancelledAt`, `reminderSent`, check-in token hash + AES-GCM encrypted copy | `prisma/schema.prisma:710` | Primary | System | No |
| `rsvp_attendees`: one row per person attending, `checkedInAt` | `prisma/schema.prisma:739` | Primary + household members | System | No |
| `invitations`: status, `sentAt`, sender (board user), token hash | `prisma/schema.prisma:343` | Primary | System | No |
| `check_ins`: time, headcount, guests checked in, **`checkedInBy` = the board member's email**, session token | `src/lib/checkin.ts` | Primary; board member | System | No |
| Walk-in: first/last name, email, phone, address, language, headcount, verbal consents | `POST /api/admin/checkin/walkin` | Primary (no household, no diagnoses) | Name + (email or phone) + data consent | No |

### 1e. Contact-form sender (not stored in the database)

`src/components/contact/ContactForm.tsx` → `POST /api/contact` (`src/app/api/contact/route.ts`).

| Field | Required? | Health info? |
| --- | --- | --- |
| Name | Required | Possibly (free text) |
| Email | Required | No |
| Phone | Optional | No |
| Reason (general, family/patient support, volunteering, sponsorship, media, other) | Required | No |
| Message | Required, free text | **Possibly**: nothing stops a sender describing a condition |
| Locale, honeypot, time-on-page (`elapsedMs`), Turnstile token | System | Used for spam checks, **not stored** |

Nothing from this form is written to the database. It is emailed (via Resend) to a mailbox chosen by `getContactRecipient` (`src/lib/contact-routing.ts`: secretary, treasurer, communications lead or info@), with the sender as `replyTo`, plus an auto-reply to the sender.

### 1f. Board members

| Field | Where | Notes |
| --- | --- | --- |
| First name, last name, email | `POST /api/admin/settings/board/invite` → `patients` row with `role = "board"` + `contact_profiles` | Entered by a President/VP |
| Role, optional org mailbox (`fromEmail`), `assignedBy` (assigner's email), `assignedAt`, `active` | `board_roles` (`prisma/schema.prisma:161`) | |
| Sign-in identities (`user_identities`): Auth0 subject id, provider, email as the provider gave it, verified flag, how/when linked | Linked on first sign-in by verified email (`src/lib/identity/link.ts`). Sign-ins that match no household are kept 30 days (retention cron), then deleted. `patients.auth0Id` is deprecated and no longer written | Auth0 itself also holds the login profile |
| Onboarding email sent time | `board_onboardings` | |
| Dormant: encrypted Gmail OAuth tokens | `board_roles.gmail*` columns | **Still stored** after the Gmail feature was cut (RESTORE.md) |

### 1g. Website visitors

| Data | Where | Notes |
| --- | --- | --- |
| IP address, user agent, URL (including token paths) | Seen by Vercel (hosting), by Cloudflare when loading R2 photos and the Turnstile script, and by Google when loading Maps/Places | **The app itself never stores IPs.** `audit_logs.ipAddress`/`userAgent` exist as columns but no code writes them (grep confirmed) |
| Page views: sanitized path, country, device, browser, OS, referrer | Vercel Web Analytics (`src/components/analytics/SiteAnalytics.tsx`, `src/lib/analytics.ts`, `docs/overhaul/ANALYTICS.md`) | Public pages only. `/admin`, `/api`, tokens and query strings are stripped or dropped in the browser |
| Custom events (`register_info_submitted`, `rsvp_submitted`, `language_switched`) | Same | **Off** unless `NEXT_PUBLIC_ANALYTICS_CUSTOM_EVENTS=true` |
| Language choice | `locale` cookie | See section 5 |
| Closed site announcements (`site_announcements` toggle) | `hoep.dismissedAnnouncements` in the visitor's browser (localStorage) | Never sent to the server. See section 5 |

### 1h. Photos

Board members upload event photos (`/admin/events/[id]/photos`). Photos can show faces, including minors. They are **not linked to any person** in the database. `event_photos` stores URLs/keys, optional EN/ES captions, `approved`, and `uploadedBy` (the uploading board member's email). Approved photos are public on `/gallery`, event recap pages and as event covers (`src/lib/photos/public.ts`).

### 1i. Public site content (Sanity)

Person records for the About page: name, photo, group (officer, member at large, advisor, founder, past president, "in memory of"), bio. Sponsor records: name and logo. Site settings: org phone/email/address. Schema: `src/sanity/schemas/documents/`. These are about board members, past presidents and deceased honorees, not patients. The `person` schema warns "Never add someone until they are approved for public release."

### 1j. Dormant data from cut features

These tables/columns still exist (migrations are additive-only, rule 1) and may hold personal or health data **if any rows were ever written**. The code that wrote them is gone. See `docs/overhaul/RESTORE.md`.

| Table / columns | What it could hold | Note |
| --- | --- | --- |
| `disorder_profiles` | Condition, severity, treating physician, specialty pharmacy, **diagnosis letter URL/key**, verification fields | Letters in R2 "remain; do not delete" per RESTORE.md |
| `financial_assistance_applications`, `assistance_documents`, `assistance_disbursements` | Amounts, purposes, uploaded bills/receipts (R2), check numbers | R2 files remain (PHI-adjacent) |
| `family_members`, `families`, `family_memberships`, `board_approvals` | Old family system | |
| `volunteer_*` tables, `patients.wantsToVolunteer` | Volunteer applications, timecards | |
| `sponsors`, `sponsor_access_tokens` | Sponsor contacts (name, email, phone) | |
| `contact_profiles.dateOfBirth`, `patients.emergencyContact*`, `patient_preferences` (dietary, accessibility needs, topics), `rsvps.dietaryRestrictions/specialNeeds` | Old registration fields | No current code writes these |
| `board_roles.gmail*`, `communication_logs` | Encrypted OAuth tokens; email subjects/previews and to/from | |
| `newsletters`, `board_minutes`, `annual_reports`, `tax_filings`, `scholarships`, polls, questions, presentations | Org content, some with free text | |
| `patient_preferences`, `event_questions`, `poll_responses` | Free-text and preferences | |

---

## 2. Where each piece is stored and who can access it

### 2a. Storage map

| Data | Stored in | Notes |
| --- | --- | --- |
| Name, email, phone, address, language, household, RSVP, check-in, invitations | **Neon Postgres**: `patients`, `contact_profiles`, `household_members`, `rsvps`, `rsvp_attendees`, `check_ins`, `invitations` | `prisma/schema.prisma` |
| Diagnoses (primary, minors, confirmed adults) | Neon: `patients.primaryDiagnoses`, `patients.statedDiagnoses`, `household_members.statedDiagnoses` | Three copies of the same kind of data |
| Consents | Neon: `consent_records` (append-only; DB trigger rejects UPDATE) | Migration `20261113180000_thin_patient_consent` |
| Confirmation / RSVP tokens | Neon: SHA-256 hashes (`household_members.confirmTokenHash`, `invitations.tokenHash`, `rsvps.checkInTokenHash`). `rsvps.checkInTokenEnc` is an AES-256-GCM copy (key `CHECKIN_TOKEN_KEY`) so the same QR can be re-sent | Raw tokens exist only in emailed links/QRs (`src/lib/tokens.ts`) |
| Email send log | Neon: `email_logs` | Code-built emails store **only** kind, status, error name, `patientId` (recipient and subject are `""`): `src/lib/email/send.ts`. The older template path stores the **recipient address and subject**: `src/lib/email-service.ts:80`; today that path is used only for `BOARD_ROLE_ASSIGNED` (`src/lib/board/assign.ts:104`) |
| Audit trail | Neon: `audit_logs` | `details` is meant to hold ids and field names only, but some entries contain emails: board role assigned "by {admin email}", onboarding email "sent to {board email}", test email "to {address}", "Deleted event: {title}" |
| Contact-form messages | **Not in the database.** Resend → HOEP mailbox | Lives in the receiving mailbox indefinitely |
| Event photos | **Cloudflare R2** (`src/lib/r2.ts`, key layout in `src/lib/photos/keys.ts`) + `event_photos` row | `uploads/tmp/<eventId>/<uuid>` original with EXIF/GPS, deleted after processing; `photos-pending/<eventId>/<uuid>.webp` + `-t.webp` not approved; `photos/<eventId>/<uuid>.webp` approved and public. Metadata is stripped when processed (`src/lib/photos/process.ts`) |
| Event flyers | R2 `flyers/<eventId>/…` (EN and ES, PNG/JPG/PDF) plus `events.flyerEnAlt/flyerEsAlt` (short descriptions) | Public URLs. Invitation emails to households that chose email show the flyer inline from its public URL (no attachment) |
| Flyer delivery preference | Neon: `patients.flyerDelivery` (`email` / `mail` / `none`) | Household-level; set at registration, on the family page (any confirmed adult) or by President/VP. Changes are audited with ids and the field name only |
| Flyer mailing list | Generated on demand (CSV, label sheet) from approved, invited households with `flyerDelivery = mail` and a complete address | President/VP only (`canManageUsers`). Contains names and postal addresses, so the file is personal data once downloaded. Each export writes one audit row: event id, count, actor (no names) |
| RSVP requests | Neon: `rsvp_requests` (event id, household id, source, status, who is coming as ids and a guest count, decline reason CODE, who decided and when) | Created when a household that wasn't invited asks to attend (event page, emailed link, family page, registration). No free text. The decline reason code is never shown to the family or put in an email. Board: `canManageEvents`. Deleted with the household (cascade) |
| Attendance type | Neon: `invitations.attendanceType` / `rsvps.attendanceType` (`in_person` / `virtual`) and `invitations.origin` (`matched` / `request` / `manual`) | Set by the board when it confirms a request or switches an invitation |
| Virtual links | Neon: `events.meetUrl`, `events.youtubeUrl` (event settings, board only) | Sent only in virtual invitations, confirmations and reminders to households confirmed to attend virtually. Never on a public page, in an in-person email, in an audit row or in an email log. Off until the `recordings` feature is on |
| Call log | Neon: `invitation_call_logs` (event, household, invitation, purpose, outcome CODE, who called and when, `source` manual/dialer) | Written by the call list's "called" button (and later the dialer). No notes, no phone numbers (the number stays on the contact profile) |
| "Also send invitations to" | Neon: `patients.alsoSendToMemberIds` (ids of confirmed adults) | Any confirmed adult or the President/VP can change it; each change is audited with ids only. The addresses themselves stay on the member rows |
| "Can this number get texts?" | Neon: `patients.phoneCanText`, `household_members.phoneCanText` (yes / no / not stated) | Stored only, for the future texting work; reset when the number changes. Audited with the field name only |
| Legacy uploads (diagnosis letters, assistance documents, receipts, tax PDFs, minutes) | R2 | Left in place by the cuts |
| Board and public-site content | **Sanity** (private dataset `production`, project `ed5kyl4v`) | Read by the server with a Viewer token; edited in the embedded Studio at `/admin/studio` |
| Board and family logins | **Auth0** tenant + `user_identities` | |
| Sent email copies | **Resend** | Full body and recipient |
| Request logs, page-view analytics | **Vercel** | |
| Language preference | `locale` cookie in the visitor's browser; `patients.preferredLanguage` in Neon | |
| Closed site announcements | Visitor's browser only (localStorage) | Not stored by HOEP |

### 2b. Who can access what (admin)

`/admin/*` and `/api/admin/*` require an Auth0 session whose identity is an @<mail domain> Google Workspace account of a person with role `admin` or an active board role (`src/middleware.ts` → `/api/session/access`; any other sign-in is a family session and gets `/portal` only). Each route then enforces a permission (`src/lib/permissions.ts`). A board user with no active role has no permissions. Role `admin` (super admin) has every permission.

| Permission | Roles that have it | What it unlocks |
| --- | --- | --- |
| `canManageUsers` | President, Vice President (+ admin) | Patients directory: list, search, detail, edit, add, delete, merge, household actions, CSV export (`src/app/api/admin/patients/*`). Every detail view writes a `PATIENT_VIEWED` audit row |
| `canViewPHI` | President, VP (+ admin). Narrowed from also Secretary and Treasurer on 2026-11-23 to match the Privacy Policy; `scripts/check-permissions.ts` enforces it | Seeing and editing diagnoses (patient detail, invitation lists). **CSV export includes diagnoses only for role `admin`** (`withDx = admin.isSuperAdmin` in `src/app/api/admin/patients/export/route.ts`) |
| `canManageEvents` | President, VP | Events, invitations, sending, check-in console, RSVP add, photo approve/delete, patient name/email/phone **search** (`/api/admin/patients/search`), attendee page and sign-in sheet (names, relationships, NO PHOTOS flag) |
| `canViewEventStats` | President, VP, Secretary, Treasurer, Events Coordinator, Sponsor Liaison | `/admin/attendance` and `/admin/events/[id]/stats`: checked-in attendees with **full email and phone**, plus a client-side CSV export (`src/app/admin/attendance/page.tsx:24`, `src/components/admin/stats/AttendeeListExport.tsx`) |
| `canViewAuditLogs` | President, VP, Treasurer | `/admin/audit-logs` (actor name/email, action, details) |
| `canAssignBoardRoles` | President, VP | Invite/assign/remove board members |
| `canManageEmailTemplates` | President, VP | Email templates, test sends (to any address) |
| `canEditSiteContent` | President, VP, Secretary, Treasurer | Sanity Studio |
| `canViewAdminDashboard` | **Every** board role | Dashboard shows counts and the 10 most recent RSVPs with patient names (`src/app/admin/dashboard/page.tsx`), the events list, the event photo list, and the `/api/translate` DeepL endpoint |

Everyone outside the board has **no account and no access**. Patients and household members cannot log in; they act only through emailed links (token = credential, 256-bit, hashed in the DB).

---

## 3. Third parties that receive personal data

| Service | What it receives | Why | Notes |
| --- | --- | --- | --- |
| **Vercel** (hosting) | Every request: visitor IP, user agent, full URL **including tokens in `/rsvp/<token>`, `/confirm/<token>`, `/api/checkin-qr/<token>` and `/api/unsubscribe?token=`**. All form submissions pass through its serverless functions. Environment secrets | Runs the site and the two daily cron jobs (`vercel.json`) | Log retention depends on plan (verify). No log drain configured in the repo |
| **Vercel Web Analytics** | Sanitized page URL, country, device, browser, OS, referrer. Custom events off by default | Page-view counts for public pages | URLs are sanitized in the browser before sending; admin/API never reported. Vercel documents no cookies (re-check, as `ANALYTICS.md` says) |
| **Neon** (Postgres) | The entire database, including diagnoses | Primary data store | Production endpoint recorded in `scripts/db-endpoints.json`. Region, backup/PITR window not in the repo |
| **Resend** (email) | Recipient address, sender, subject and full HTML of every email: first names, event title/date/time/location/description, links containing tokens, QR image URL. Contact form: sender's name, email, phone, message | Sends every email in section 6 | Domain region `us-east-1` (CUTOVER.md). Resend keeps its own log of sent email; retention and open/click tracking are dashboard settings (verify) |
| **Cloudflare R2** | Event photos (originals briefly, then processed copies), flyers, legacy documents. Visitors' browsers load public photos directly from R2 | File storage | Board browsers upload originals straight to R2 with presigned URLs |
| **Cloudflare Turnstile** | Visitor browser → Cloudflare (script + challenge) on `/contact`, `/register-info` and the public RSVP form. Server → Cloudflare: secret + token only (no visitor IP is forwarded: `src/lib/turnstile.ts`) | Bot protection | May set its own browser storage (verify) |
| **Sanity** | Public-site content, incl. board/officer names, photos, bios. Board editors' Sanity logins. No patient data | CMS for About, Home, Resources, etc. | Dataset is private. **Anyone with Sanity project access can read every document, including ones hidden with "Show on site" off** |
| **Auth0** | Board members' login identity (email, name, subject id, login events, IP). Also **anyone who clicks the login button**, because Auth0 can create a user record for any social login before the app rejects them | Board-only login | Connections per `.claude/stack.md`: Google, Apple, Facebook. The Post-Login Action (`docs/overhaul/auth0-post-login-action.js`) only denies unverified emails; there is no allow-list. Production social connections: `docs/overhaul/AUTH0_PRODUCTION.md` |
| **Google Places** (Maps JS API) | As someone types their address, the text is sent to Google with their IP and the site's API key. Loaded on the **public** `/register-info` and public RSVP form, and on the admin patient/event forms (`src/components/form/PlacesAutocompleteInput.tsx:99`) | Address autocomplete | Only if `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set; without the key the field is a plain input. No consent gate before the script loads |
| **Google Maps embed** | Visitor IP/browser to Google when `/contact` loads (iframe: `src/components/contact/ContactMap.tsx:26`, `src/components/sanity/ContactParts.tsx:92`) | Map on the contact page | No consent gate. May set Google cookies (verify) |
| **DeepL** | Text typed into event title/description/recap fields (up to 5,000 characters) when the board clicks Translate (`src/lib/translate.ts`, `src/app/api/translate/route.ts`) | EN↔ES translation | Not patient data unless a board member types it. Plan (Free vs Pro) decides whether DeepL keeps the text: verify |
| Facebook | Nothing sent. The site only links to the Facebook group | | No pixel, widget or SDK found |

Cut features whose credentials may still exist: Pusher, CloudConvert, Gmail OAuth (RESTORE.md lists the env vars and says to revoke the Gmail OAuth client). No data is sent to them by the current code.

Fonts (`next/font/google`) are downloaded at build time and served from HOEP's own domain, so visitors do not contact Google Fonts. QR codes are generated on the server (`qrcode`), with no third party. The scanner camera (`html5-qrcode`, admin check-in only) processes video in the browser.

---

## 4. Retention and deletion

### 4a. Deleted automatically

| What | When | How |
| --- | --- | --- |
| **Pending adult household member details** | Daily cron `/api/cron/expire-members` at 14:15 UTC (`vercel.json`). A member still `pending` after **30 days** (`CONFIRM_TOKEN_DAYS`; token expiry, or `createdAt` + 30 days if there was no token) | `expirePendingMembers` in `src/lib/households/confirm.ts` nulls first name, last name, email, diagnoses, phone-confirm flag and token; status becomes `expired`. A **placeholder row stays** (relationship, age group, status, `createdAt`) so household size still counts. Removed from upcoming RSVPs. Audit row with ids only |
| Same purge on **decline** | Immediately when the adult clicks "Remove me" | `declineMember`, same `purgedMemberData` |
| Household confirm token | Single use; cleared on confirm/decline; 30-day expiry; replaced on resend | `src/lib/households/confirm.ts` |
| RSVP check-in token and QR | Hash and encrypted copy are cleared when the RSVP is cancelled. The QR image endpoint stops serving after the event ends (`src/app/api/checkin-qr/[token]/route.ts`) | **Not cleared after the event ends**: the hash and encrypted copy stay in `rsvps` |
| Invitation token | Replaced on every send. `/rsvp/[token]` stops accepting answers once the event has ended | The hash stays in `invitations` |
| `uploads/tmp/` original photos (carry EXIF/GPS) | Deleted in a `finally` block right after processing, success or failure (`src/lib/photos/ingest.ts`) | **Uploads that are never processed are not cleaned up**; no R2 lifecycle rule exists in the repo |
| Unapproved photo's old public URL | Approve/unapprove moves the file to a new random key and deletes the old one | `src/lib/photos/service.ts` |
| Duplicate patient on merge | Hard-deleted after RSVPs, check-ins, consents and household move to the kept record | `src/app/api/admin/patients/[id]/merge/route.ts` |

There is no other scheduled deletion. The only other cron is the day-before reminder (`/api/cron/send-reminders`, 14:00 UTC).

### 4b. Kept indefinitely

- Patient records, contact profiles, household members (non-purged), consent records, RSVPs, attendee rows, check-ins, invitations.
- `email_logs`, `audit_logs` (no purge job, including `PATIENT_VIEWED` rows).
- Check-in token hashes and encrypted copies after the event.
- Board member records, including after removal: removing the last role demotes the row to `patient` but keeps email, name and `auth0Id`.
- Photos, flyers and all R2 legacy files; Sanity content; Auth0 users; Resend sent-email history (per Resend); Vercel analytics (per Vercel); Neon backups (per plan).
- Contact-form emails, in the receiving mailboxes.
- `ageGroup` is stored once and never advances, so a "0–5" child stays "0–5".

### 4c. How a deletion request is carried out today

There is **no public or self-service route** and no written procedure. A person has to contact HOEP (the consent text promises "I can ask HOEP to delete this information at any time"). A President or VP (`canManageUsers`) then does it by hand:

1. `/admin/patients/[id]` → "Delete" panel (`DeletePatientPanel`) → type `DELETE` → `DELETE /api/admin/patients/[id]` (`src/app/api/admin/patients/[id]/route.ts:114`).
2. This **hard-deletes** the `patients` row. Database cascades remove: contact profile, all consent records (the person's and their household members'), household members, RSVPs and attendee rows, check-ins, invitations, preferences, and dormant child tables.
3. Set to null rather than deleted: `email_logs.patientId`, `audit_logs.patientId`, `possibleDuplicateOfId` on other rows, consent `recordedBy`, invitation `sentBy`. The log rows remain; they hold ids and field names, not names.
4. An audit row `USER_DELETED` records counts only.

Individual household members can be removed with `DELETE /api/admin/patients/[id]/members/[memberId]` (their consent records cascade).

**Not covered by this process:** copies in Resend, Vercel logs, Neon backups/history, the contact-form email in HOEP mailboxes, published photos (not linked to a person, so a person's photos cannot be found automatically), and Auth0 or Sanity records. Board members cannot be deleted through this route (`PATIENT_ONLY` excludes them).

Consent withdrawal: a board member can edit consents on the patient page (adds a new `granted: false` row, method `phone`). Effect: invitations are blocked. Transactional emails to people with an active RSVP (confirmation, reminder, cancellation) still go out. The recipient can also use the unsubscribe link in an invitation, which sets `emailOptOut` (invitations only) and does **not** touch consent records.

---

## 5. Cookies and local storage

| Name | Set by | Purpose | Lifetime | Tracking? |
| --- | --- | --- | --- | --- |
| `locale` (`en`/`es`) | Client: `src/context/LanguageContext.tsx:58,68,86` (js-cookie), on first visit it writes `en` if none exists, and on every language switch. Server: `src/middleware.ts:25` (when a link has `?lang=`), `/api/user/set-locale` (board sessions) | Remembers display language | 365 days, path `/`, SameSite=Lax; `Secure` when set by the server in production; **not** HttpOnly | **No.** First-party, functional. Set for every visitor even if they never touch the language switch |
| Auth0 session cookie (SDK default name, `appSession`; name not configured in the repo) and short-lived login-transaction cookies | `@auth0/nextjs-auth0` | Keeps a **board member** signed in | Session | No. Board only; never set for ordinary visitors unless they click login |
| Auth0 tenant cookies (on Auth0's domain) | Auth0 | Single sign-on | Per Auth0 | Verify |
| Sanity Studio browser storage | Sanity (`/admin/studio`) | Studio login/state | Per Sanity | Board only |
| Third-party browser storage possible from embeds | Cloudflare Turnstile (`/contact`, `/register-info`), Google Maps iframe (`/contact`), Google Places script (`/register-info`, admin forms) | Bot check; map; autocomplete | Unknown | **Not verified.** Open DevTools → Application on the production site |

- `localStorage`: **one entry**, `hoep.dismissedAnnouncements` (`src/components/announcements/AnnouncementCard.tsx`, `src/lib/announcements/display.ts`). Written only when a visitor closes an announcement. A list of up to 50 announcement ids (Sanity document ids; for automatic conference announcements also the registration opening date): no personal or health data, never sent to the server, kept until the visitor clears browser data.
- `sessionStorage`, IndexedDB: **none** in the app code (grep over `src/`).
- No Google Analytics, Tag Manager, Meta pixel, Hotjar, Sentry or similar anywhere in the code or `package.json`.
- Vercel Web Analytics: documented by Vercel as cookie-less (re-check their current page, per `ANALYTICS.md`).
- There is no cookie banner and no cookie policy page.

---

## 6. Emails sent

All sent through Resend. Code-built emails go through `sendLoggedEmail` (`src/lib/email/send.ts`). Shared layout: `src/messages/EmailLayout.tsx` (header, phone, website, Facebook link; **no postal address**; an unsubscribe line only when the template passes one).

| Email | Trigger | To | Contents | Unsubscribe link? | Logged in `email_logs`? |
| --- | --- | --- | --- | --- | --- |
| Registration confirmation (`REGISTRATION_INFO_CONFIRMATION`) | Someone submits `/register-info` with an email. Board can resend from the patient page | The registrant | Generic thank-you with first name. No diagnosis or household detail | No | Kind/status only |
| Member confirmation (`MEMBER_CONFIRMATION`) | Registration with an adult household member who has an email; board "resend" | **The adult household member** (an address the registrant typed, not the person themselves) | Their first name, the registrant's first name, a `/confirm/<token>` link | No | Kind/status only |
| Event invitation (`EVENT_INVITATION`) | Board clicks **Send** on an event's invitations page (`src/lib/invitations/send.ts`). Rechecks at send time: data-and-contact consent granted, has email, not opted out | Matched, consenting patients | First name, event title/date/time/location, description (first 500 chars), `/rsvp/<token>` link, unsubscribe link. For targeted events, recipients are chosen by diagnosis match, but match reasons are never in the email | **Yes** (`/api/unsubscribe?token=…`, HMAC-signed; sets `emailOptOut`, invitations only). No `List-Unsubscribe` header | Kind/status only |
| RSVP confirmation (`RSVP_CONFIRMATION`) | RSVP "yes" via link, public form or board "Add RSVP" (not for walk-ins); "email me my QR again" | The RSVPing patient | First name, event details, party size, QR image URL, `/rsvp/<token>` link | No (transactional) | Kind/status only |
| RSVP reminder (`RSVP_REMINDER`) | Daily cron 14:00 UTC, for events happening tomorrow (Mountain Time) | Active RSVPs with an email | Same as confirmation, with a new token | No | Kind/status only |
| RSVP cancellation (`RSVP_CANCELLATION`) | RSVP cancelled by the patient or board | The patient | Event details | No | Kind/status only |
| Board role assigned (`BOARD_ROLE_ASSIGNED`) | Board role assigned or invitation (`src/lib/board/assign.ts:104`) | The board member | Name, role, org mailbox, dashboard link | No | **Yes, with recipient address and subject** (`email-service.ts`) |
| Contact-form notification | Contact form submitted | HOEP mailbox for that reason, `replyTo` = sender | Sender's name, email, phone, reason, message. Subject contains the sender's name. Flagged "[Contains links: please verify]" if links found | n/a (internal) | **No** |
| Contact-form auto-reply | Same | The sender | "We received your message", name, reason | No | **No** |
| Template test send | Board clicks "send test" on an email template | Any address typed in | Sample data | No | No, but an audit row stores the test address |

Not sent today (code or templates still exist): check-in confirmation, event published, event cancelled; assistance, volunteer, family-invite and newsletter emails were removed with their features. `emailOptOut` blocks only invitations by design.

---

## 7. Consents

### 7a. Types and how they are recorded

Table `consent_records` (`prisma/schema.prisma:361`): `patientId` **or** `householdMemberId`, `type`, `granted`, `textVersion`, `method` (`web` or `phone`), `recordedByBoardUserId` (set for phone), `createdAt`. **Append-only:** a database trigger rejects UPDATE; a change is a new row, and the newest row per type wins (`currentConsents` in `src/lib/patients/query.ts`). Rows disappear only when their patient or member is deleted.

| Type | Whose | Required? | Stored when |
| --- | --- | --- | --- |
| `data_and_contact` | Primary (speaks for the primary and listed minors) | Required to register | Every registration; also on board edits |
| `media` | Primary (primary and minors) | Optional | Every registration, as granted true/false |
| `age_guardian_attestation` | Primary | Required on the web form when a household is entered | Only stored as granted true. Not recorded for walk-ins (no household) |
| `data_and_contact` | Adult member, for themselves | Required to confirm | On `/confirm/[token]` or board phone-confirm |
| `media` | Adult member | Optional | Same |
| `adult_attestation` | Adult member ("I am 18 or older") | Required | Same |

Phone and walk-in consents are recorded with method `phone` and the board user's id; the board member ticks the boxes on the person's behalf after hearing their answer. No separate evidence of the verbal consent is stored.

### 7b. Current wording: version `v1` (`CONSENT_TEXT_VERSION` in `src/content/consent.ts`)

Display order on every form: attestation, data and contact, media. Past versions `draft-1` and `draft-2` are kept in the file (the file comments say dev records only). **Never edit `v1` in place; add `v2` and bump the constant.**

**Primary: 18+/guardian attestation**
- EN: "I am 18 or older, and I am the parent or legal guardian of any minors I listed, or have their guardian's permission."
- ES: "Tengo 18 años o más, y soy el padre, la madre o el tutor legal de los menores que incluí, o tengo el permiso de su tutor."

**Primary: data and contact**
- EN: "I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide about me and the minors in my household, and may contact me by email, phone, or mail about HOEP events and services. I can ask HOEP to delete this information at any time."
- ES: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí y sobre los menores de mi hogar, y se comunique conmigo por correo electrónico, teléfono o correo postal sobre eventos y servicios de HOEP. Puedo pedir a HOEP que elimine esta información en cualquier momento."

**Primary: media**
- EN: "I agree that HOEP may use photos or video that include me or the minors in my household at HOEP events in its materials and on its website and social media. This does not cover other adults, who answer for themselves. This is optional."
- ES: "Acepto que HOEP pueda usar fotos o videos en los que aparezcamos yo o los menores de mi hogar en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto no cubre a otros adultos, que responden por sí mismos. Esto es opcional."

**Adult member: data and contact**
- EN: "I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide about myself, and may contact me about HOEP events and services. I can ask HOEP to delete my information at any time."
- ES: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí y se comunique conmigo sobre eventos y servicios de HOEP. Puedo pedir a HOEP que elimine mi información en cualquier momento."

**Adult member: media**
- EN: "I agree that HOEP may use photos or video that include me at HOEP events in its materials and on its website and social media. This is optional."
- ES: "Acepto que HOEP pueda usar fotos o videos en los que aparezca yo en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto es opcional."

**Adult member: age**
- EN: "I am 18 or older." ES: "Tengo 18 años o más."

### 7c. What the consents do in practice

- `data_and_contact` is re-checked at invitation-send time (`emailBlocker` in `src/lib/invitations/match.ts`). Without it, no invitation is sent.
- `media` is **informational only**. It drives the "NO PHOTOS" badge at check-in, on the attendee page and the printed sign-in sheet, and a count on the photos page. Nothing technically stops a photo being approved, and photos are not tied to people.
- Nothing is collected from anyone without one of these consents, except: contact-form senders (no consent checkbox, no notice), board members (no consent record), and visitors (analytics, cookies).
- No privacy-policy link or notice appears on any form, email or footer. A repo-wide search found no privacy or terms page and no mention in the forms.

---

## 8. Recommendations

Priority: **High** = likely to contradict what a policy would say or exposes data; **Medium** = fix or decide before launch; **Low** = tidy-up. All need Stephen's or the board's decision. Nothing here has been changed.

### Collected but not clearly needed

1. **Address (Medium).** Optional, stored, shown in admin and exported, but no feature uses it (no mailing function exists). The consent text mentions contact by mail, which is the only justification. Either drop the field from the public form, or reduce it to city/ZIP. If kept, the policy must say why.
2. **Google Places on the public registration form (High).** Every address keystroke goes to Google before the person has consented or submitted, on the same page where health information is entered. Because the address is optional and unused, the simplest fix is to use a plain input on the public form (the component already falls back to a plain input when the key is absent; the admin forms can keep autocomplete).
3. **Google Maps iframe on `/contact` (Medium).** Loads Google with no notice or consent gate. Replace with a static image or the existing "open in Maps" link.
4. **Free-text contact message (Medium).** Senders may include medical details, and the message (and the sender's name in the subject line) sits in Resend and in a mailbox indefinitely. Add a short notice on the form ("please don't include medical details") and a link to the policy.
5. **Collecting minors' diagnoses and last names (Low).** Needed for event targeting and check-in, so reasonable, but the policy should say it plainly. `family_caregiver` and `carrier` in a "diagnoses" list are also worth reviewing, since they describe a relationship or status rather than a condition.
6. **Three copies of diagnoses (Low).** `primaryDiagnoses`, `statedDiagnoses` and `household_members.statedDiagnoses`. Deletion covers all three by cascade, but any export or backup carries all of them.
7. **`checkedInBy` and `uploadedBy` store board members' emails (Low).** Fine, but they are personal data of board members; mention board data in the policy.

### Dormant data and credentials (decide before launch)

8. **Confirm dormant tables are empty in production (High).** `disorder_profiles` (diagnosis letters, physician, pharmacy), the assistance tables, volunteer, sponsor contact and family tables. RESTORE.md says mock data only; once real data exists, a policy cannot list categories the app no longer collects. If any real rows or R2 files exist (diagnosis letters, assistance documents, receipts), decide whether to delete them. Rule 1 forbids dropping tables or columns, but not deleting rows or R2 objects.
9. **Gmail OAuth tokens still stored (Medium).** `board_roles.gmail*` hold encrypted tokens for a feature that no longer exists. RESTORE.md already recommends revoking the OAuth client. Also clear the token columns (data change, not schema) and keep `GMAIL_TOKEN_ENCRYPTION_KEY` only if a restore is likely.
10. **Unused vendor accounts (Low).** Pusher, CloudConvert, Gmail API: close or rotate credentials so no dormant account holds data.

### Retained longer than necessary, or not deleted when it should be

11. **Deleting an event leaves its photos and flyers in R2 (High).** `src/app/api/admin/events/[id]/route.ts:101` only runs `prisma.event.delete`. The database cascade removes the `event_photos` rows, but the R2 files stay, including **approved public photos whose URLs are still live** and can no longer be removed from the admin. Fix: delete the R2 objects (photos, thumbnails, flyers) before deleting the event.
12. **No R2 lifecycle rule for `uploads/tmp/` (Medium).** Originals with GPS/EXIF are deleted only if processing runs. Add a bucket lifecycle rule (for example, expire `uploads/tmp/` after 1 day).
13. **Pending (unapproved) photos are protected only by an unguessable URL (Medium).** If the R2 bucket's public URL serves the whole bucket, `photos-pending/` objects are fetchable by anyone who has the link. Verify bucket settings; consider a private bucket or presigned access for pending photos.
14. **No retention schedule at all (High for the policy).** Proposed starting points, all for the board to set: audit logs 2–3 years; email logs 1 year; clear `checkInTokenHash`/`checkInTokenEnc` and invitation hashes some days after the event ends; review patients with no RSVP or contact in N years (for example 3) and ask or delete; age-group refresh for minors. The policy needs a sentence on each.
15. **Household placeholders (Low).** After a purge, relationship/age group/status/`createdAt` remain. This is deliberate (keeps household size) and is not identifying; just state it.
16. **Backups (Medium).** Deleted data may remain in Neon backups/history and in Resend for a period. Find the Neon plan's window and Resend's retention so the policy can state it honestly.
17. **Board member removal keeps the record (Low).** Email, name and `auth0Id` stay. Decide whether to delete the row some time after removal (the Auth0 user and the Sanity member also need removing by hand).

### Deletion and consent handling

18. **No documented deletion/withdrawal process (High).** The consent text promises deletion "at any time", but there is no published contact route, identity check, deadline or runbook, and the process leaves copies elsewhere (section 4c). Write a short runbook: who receives requests (a dedicated address), how identity is checked, 30-day target, steps (delete patient, ask Resend to delete, note backup expiry, remove from any known photo), and a confirmation reply.
19. **Consent withdrawal does not stop all contact (Medium).** Withdrawing `data_and_contact` blocks invitations only; confirmation and reminder emails continue to people with an active RSVP; `emailOptOut` is separate from consent. The policy should say so, or withdrawal should cancel future emails.
20. **`media` consent is not enforced (Medium).** The gallery relies on a person remembering to check the NO PHOTOS flag and the count. Photos are not linked to people, so a withdrawal cannot be applied to existing photos automatically. State in the policy how to ask for a photo to be removed, and keep that process in the runbook.
21. **Third-party emails (Medium).** Adults get a confirmation email because the registrant typed their address. The 30-day purge and "Remove me" cover this well; the policy should describe it, and the consent screen could say that adults will be emailed once.
22. **Consent wording gaps (High for the policy).** v1 does not mention health information/diagnoses, service providers (Resend, Neon, Vercel, etc.), retention, how to withdraw, or link to a policy. Because v1 must never be edited in place, add `v2` when the policy goes live and decide whether existing `v1` consents need re-confirmation.
23. **Diagnosis-targeted invitations imply a diagnosis (Medium).** `src/lib/email/send.ts` already notes that event titles can imply a diagnosis. The invitation (event title, description) sits in Resend and in the recipient's mailbox. Review wording of targeted events, and disclose in the policy that invitations may be tailored.

### Access, logging and security

24. **Event stats and attendance expose full email and phone to six roles (High).** `canViewEventStats` (President, VP, Secretary, Treasurer, Events Coordinator, Sponsor Liaison) can see and export attendee emails and phones (`src/app/admin/attendance/page.tsx:24`, `src/components/admin/stats/AttendeeListExport.tsx`), while the Patients directory is limited to President/VP. The CSV is labelled "PRIVACY-SAFE FORMAT - Names abbreviated" but contains the full email and phone. Mask contact details unless `canManageUsers`, and fix the label.
25. **Dashboard shows recent RSVP names to every board role (Low).** `canViewAdminDashboard` is held by all roles. Decide if that is intended.
26. **Audit log `details` sometimes hold emails (Low).** Board assignment and test sends write board/test emails into `details`; event deletion writes the event title. `ipAddress`/`userAgent` columns are never written, so the policy should not claim IP logging in the audit trail.
27. **Auth0 allow-list must be live (High).** The Post-Login Action in the repo is marked "NOT APPLIED". If it is not active, any Google/Apple/Facebook account that visits `/api/auth/login` creates an Auth0 user record before the app turns them away. Verify the Action is deployed and attached to the Login flow, and add Auth0 to the policy.
28. **Tokens in URLs (Medium).** `/rsvp/<token>`, `/confirm/<token>`, `/api/checkin-qr/<token>` and `/api/unsubscribe?token=` will appear in Vercel request logs, and (for QR) in email-client image proxies. Pages send `Referrer-Policy: no-referrer` and `noindex`, and analytics strips them, which is good. Verify that Resend open/click tracking is **off** (click tracking would rewrite these links through Resend's domain), and check Vercel log retention.
29. **Unsubscribe token secret (Low).** `src/lib/unsubscribe-token.ts:3` falls back to `"dev-secret"` if `CRON_SECRET` is unset, and tokens never expire. Make a missing secret a hard failure in production. Also consider a `List-Unsubscribe` header and a postal address in the invitation footer (counsel to confirm whether CAN-SPAM applies to these invitations).
30. **DeepL plan (Low).** Confirm Free vs Pro (the code comment mentions the free tier). Free-tier text may be kept by DeepL. Tell staff not to enter personal information in translated fields, or add a warning next to the Translate button.
31. **Sanity access list (Low).** Anyone with Sanity project access can read hidden `person` records (including "in memory of" entries). Review who has access, and get approval from living people before listing them, as the schema description already instructs.

### Questions for counsel

32. Whether HIPAA or the Texas medical-privacy statutes (Texas Health & Safety Code ch. 181 in particular) apply to HOEP's handling of stated diagnoses.
33. Whether data about minors collected from parents needs wording beyond the guardian attestation.
34. Whether event invitations count as commercial email (postal address, unsubscribe mechanics).
35. Which notice is needed for the Google, Cloudflare and Auth0 browser-side calls (cookies/consent banner or just disclosure).
36. Bilingual policy: English and Spanish versions both need to be in force.

---

## 9. Things to verify outside the code

| Where | Check |
| --- | --- |
| **Neon** | Region; backup/point-in-time retention; who has console access |
| **Resend** | Open and click tracking off; retention of sent email; account members; domain region |
| **Vercel** | Plan; runtime log retention; log drains; Analytics plan and settings; team members |
| **Cloudflare R2** | Whether the bucket's public URL serves the whole bucket; lifecycle rules; CORS; legacy objects (diagnosis letters, assistance documents, tax PDFs, minutes) |
| **Cloudflare Turnstile** | What it stores in the browser; hostnames list |
| **Auth0** | Post-Login allow-list Action applied; enabled connections; sign-ups disabled; log retention; tenant region |
| **DeepL** | API Free vs Pro |
| **Sanity** | Dataset private; project members; token scopes (the read token is Viewer) |
| **Google Cloud** | Places key restrictions (HTTP referrer limits); revoke the old Gmail OAuth client |
| **Production browser** | DevTools → Application/Network on `/`, `/contact`, `/register-info`, `/events/<slug>` to list cookies and third-party requests actually made |
| **Production database** | Row counts for the dormant tables in section 1j |
