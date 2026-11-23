# Plan: Phase 1 (invitation log and activity-log actor type) and the sign-in spike

Prepared 2026-11-23. **Plan only. No application code, schema or branch was changed.** Build starts after Stephen approves, on its own branch, with the commit and merge commands handed to Stephen (CLAUDE.md rule 6).

Inputs: Stephen's answers to `PORTAL_AUDIT.md` questions 1 to 12; policy and consent drafts in `PHASE0_DRAFTS.md`; new attorney questions 9 to 19 in `docs/legal/ATTORNEY_QUESTIONS.md`.

## 0. What the answers change in the earlier audit

| Answer | Effect on the plan |
| --- | --- |
| Auth0 has **social logins only** | The audit's Option A relied on Auth0 passwordless (email link, SMS). **That is not available**, so the email magic link cannot come from Auth0. Families' primary sign-in becomes **our own magic link (Option C for email)**; Auth0 is kept for the board and, optionally later, for "Sign in with Google/Facebook/Apple" for families. (Confirm whether passwordless is "not enabled" or "not on your plan": if it is only not enabled, Auth0's email link is worth re-weighing in the spike. Nothing in this plan depends on it.) |
| Email link first, SMS later via **Twilio Verify** | Phase 2 has no Twilio. Twilio's own docs say Verify does not need A2P 10DLC registration, but that only covers one-time codes sent through Verify. **Any other text (reminders, notices) does need 10DLC**, which Twilio and third parties describe as roughly 1 to 3 weeks for a low-volume campaign (brand $4, campaign about $15 one-time, then a small monthly fee; sources disagree, confirm in the console). The plan below puts the Twilio account, brand and campaign registration **in Phase 2** so the lead time runs while email sign-in ships. See Section 4. |
| Primary adult only | One identity per household = the primary `Patient` row. Adult household members are not accounts. |
| Verification gates assistance, scholarships and diagnosis-targeted invitations **at matching time** | The gate is a clause in `lib/invitations/match.ts` (and a count in the event report), not a login or RSVP check. **`/rsvp/[token]` is never gated.** |
| President and VP review; add `canReviewVerification` | Section 3. |
| Delete letter on decision; no expiry; `expiresAt` nullable | Matches the audit's 5.2 model. |
| Assistance, scholarships, live events, newsletter deferred | Dropped from the build order; their dormant tables stay. |
| Refuse login on multiple matches and tell the board | Section 5 (sign-in behavior), and a board notification path is a Phase 2 requirement. |
| Purge test data after `legacy-data-counts`; R2 WAF allows only `/photos/`, `/flyers/`, `/sponsors/logos/` | Good: letters and assistance files are no longer publicly fetchable even if the bucket had a public URL. The R2 bucket for verification uploads must stay **outside** that allow-list, with presigned URLs only. `scripts/legacy-data-counts.ts` exists; the purge itself is a separate, approved, one-off step and is **not part of Phase 1**. |

---

## 1. Phase 1 scope

Goal: before any family signs in, every audit entry says *who did it* (family, board or system), and every invitation decision is reconstructable per event without storing names or diagnoses.

Phase 1 contains four items. Each is shippable alone and merges `--no-ff`.

### 1a. `canReviewVerification` permission (no schema change)

- Add `"canReviewVerification"` to the `Permission` union in `src/lib/permissions.ts`.
- Grant to `PRESIDENT` and `VICE_PRESIDENT` (admin/superadmin already pass `can()`; confirm the `isSuperAdmin` path in `getAdminWithPermissions` rather than assuming).
- Nothing uses it until Phase 4. A unit-style check (`npm run check:...` pattern used elsewhere) asserts exactly those two roles hold it.
- **`canViewPHI` is left as is.** Where it is used today (13 route/page files, 6 components; every site is a *display or edit of diagnoses*, none grants letter access, since letters do not exist in the app):

| Where | What it gates |
| --- | --- |
| `src/lib/permissions.ts` (roles PRESIDENT, VICE_PRESIDENT, SECRETARY, TREASURER; lines 44, 62, 80, 89) | Role mapping |
| `src/app/admin/patients/page.tsx:18`, `PatientsTable.tsx` | Diagnosis column in the list |
| `src/app/admin/patients/[id]/page.tsx:28,101,122`, `HouseholdPanel.tsx`, `PatientForm.tsx` | Diagnoses on the detail page and edit form |
| `src/app/admin/patients/new/page.tsx:27` | Diagnosis entry on "add patient" |
| `src/app/api/admin/patients/route.ts:17`, `[id]/route.ts:32` | Server-side stripping/accepting of diagnoses on create and edit |
| `src/app/api/admin/patients/export/route.ts:29` | Diagnosis column in CSV export (also additionally restricted to `isSuperAdmin`) |
| `src/app/admin/events/[id]/invitations/page.tsx:15`, `InvitationsManager.tsx:41,123,134,170` | Diagnoses in invitation and call lists |
| `docs/legal/DATA_INVENTORY.md:168`, `.claude/utilities.md:105`, `.claude/summary.md:247` | Docs (summary.md still lists a Verification page under it: stale) |

  **Narrowing later = changing four lines in `permissions.ts` (remove it from SECRETARY and TREASURER), then deciding who keeps diagnosis editing for the call list.** Until then the privacy policy sentence "Health information is visible only to the President and Vice President" is untrue; the policy must not ship with it (Phase 0 drafts Section 1.4).

### 1b. `actorType` on the activity log (additive migration, DEV BRANCH ONLY)

Current state: `AuditLog.patientId` is the **actor** by convention for board actions, but it is also set to the *subject* in public flows (`REGISTRATION_COMPLETED`, RSVP, household confirmation), so the column means two things. There is no actor type.

Change:

- `AuditLog.actorType String?` with values `"board" | "family" | "system" | "public"`. **Nullable, no default, no backfill**: NULL means "legacy, unclassified". A blanket backfill to `board` would mislabel public form submissions. (`db:whoami` / `scripts/db-guard.ts` stop this running on the production Neon endpoint; migration reaches production only through Stephen's normal deploy.)
- New helper `src/lib/audit.ts`: `audit({ actorType, actorPatientId?, action, resourceType, resourceId, details?, changes? })`. It rejects `details` strings that look like emails or contain a name (cheap check: no `@`; callers pass ids and codes), and **always** writes ids only. `lib/patients/audit.ts auditPatient` keeps working and is changed to pass `actorType: "board"`.
- Migrate callers incrementally. Phase 1 touches only invitation code and `auditPatient`; other callers stay NULL and are classified over time (list them in the branch description).
- `/admin/audit-logs` shows the actor type column (read-only).

### 1c. Invitation logging (additive migration, DEV BRANCH ONLY)

**Today's behavior that has to change:** `generateInvitations` inserts `pending` rows with `skipDuplicates`; removal is a hard `DELETE` of a pending row (`api/admin/events/[id]/invitations/[invId]/route.ts`). Because the deleted row is gone, **the next "generate" run (it runs on publish and on every edit) silently re-adds a household the board removed.** The log requirement forces the fix: removals become a persisted state.

Schema (all additive):

- `Invitation.removedAt DateTime?`
- `Invitation.removedByBoardUserId String?` (FK `Patient`, `onDelete: SetNull`, like `sentByBoardUserId`)
- `Invitation.removalReason String?` (a code, see below)
- Status value `"removed"` (status is a free `String` today, no enum change).
- New `AuditAction` values: `INVITATION_MATCHED`, `INVITATION_REMOVED` (`ALTER TYPE ... ADD VALUE IF NOT EXISTS`, same pattern as `20260323130000`). Reuse `INVITATIONS_SENT` for sends.

Behavior:

1. **Auto-match.** When `generateInvitations` creates a row, it also writes one `INVITATION_MATCHED` audit row per new invitation: `actorType: "system"`, `actorPatientId: null`, `resourceType: "Invitation"`, `resourceId: <invitation id>`, `changes: { eventId, patientId, triggeredByBoardUserId, trigger: "publish" | "edit" | "manual-regenerate" }`. Ids only. (No score, no match reason, no diagnosis: `match.ts` already promises never to return reasons.)
2. **Manual removal.** `DELETE` becomes `POST .../[invId]/remove` with a **required** `reason` from a fixed list; the route marks the row `removed`, sets `removedAt/By/Reason`, and writes `INVITATION_REMOVED` (`actorType: "board"`, `actorPatientId: <board user from the session>`, `changes: { eventId, patientId, reasonCode }`). Sent invitations still cannot be removed (their link is out), as today. Because the row remains, `generateInvitations` never re-adds it (its existing-set query already covers every row for the event).
3. **Reason codes** (no free text, because free text is where names and diagnoses leak into a log): `not_a_fit`, `duplicate_household`, `asked_not_to_be_contacted`, `already_informed_other_way`, `capacity`, `other`. Question 1 asks whether Stephen wants an optional free-text note stored **on the invitation row, not in the audit log**.
4. **Sends.** `send.ts` already stores `sentAt` and `sentByBoardUserId` per invitation and writes one `INVITATIONS_SENT` batch row. The report reads the per-invitation fields; no extra rows needed. It must skip `removed` rows (it filters on `pending`; verify).
5. **Excluded households.** Phase 1 does not implement the verification gate (no verification exists yet). It adds the hook: `matchPatientsForEvent` returns `excluded: { reason: "unverified_after_window", count }` aggregates, **count only, no household ids**, so the report can show "N households not matched because unverified" without being a list of who has a diagnosis. Phase 4 fills it in.

### 1d. Per-event report for President and VP

- Page `/admin/events/[id]/invitations/report`, linked from the invitations page; gated by `canManageUsers` (President and VP, the same people who may see attendee contact per `lib/attendee-contact.ts`). If Stephen would rather have a dedicated permission, `canViewInvitationLog` is a one-line addition (Question 2).
- Three tables for one event, **household display name + id, never diagnoses**:
  - **Matched**: household, matched at, trigger, who triggered (board user's display name, resolved at read time from the id).
  - **Sent**: household, sent at, sent by.
  - **Removed**: household, removed at, removed by, reason code (shown as a label).
  - Plus counts: matched, sent, removed, excluded-unverified (aggregate).
- Data comes from `Invitation` rows and the `INVITATION_*` audit rows joined by `resourceId`; the page itself writes a `PATIENT_VIEWED`-style audit row (`INVITATION_REPORT_VIEWED` would be another enum value; Question 3 asks whether Stephen wants that, as the policy says "access to records is logged").
- CSV export of the same tables: off by default (Question 3).
- Retention: audit rows follow the existing 3-year rule in `lib/retention.ts`; no change. The `Invitation` tokens clear 30 days after the event as today; the log keeps ids only.

### 1e. Tests and checks

- `npx tsc --noEmit` against `docs/overhaul/tsc-baseline.txt` and `npm run build` (rule 3).
- A script `scripts/check-invitation-log.ts` (same style as `check:event-save`) on the **dev** database: create an event, publish (expect N matched rows), remove one with a reason (expect row `removed`, one audit row), edit the event (expect the removed household is **not** re-added), send (expect removed row skipped), read the report, assert no audit row's `details`/`changes` contains an email, a name or a diagnosis string.
- Permission check from 1a.

### 1f. Branch and delivery

- Branch `feat/invitation-log` off `main`. Migrations dated after `20261123…`, additive only.
- Claude Code does not commit. Deliverable at the end: commit messages with exact file lists and the `git add` / `git commit` commands, then `git checkout main && git merge --no-ff feat/invitation-log`. Suggested split into three commits: (1) permission + audit helper + `actorType` migration, (2) invitation soft-remove + log + migration, (3) report page + check script.
- **Production note:** the migration must run through the normal deploy after merge; the `check-invitation-log` script must only be run against the dev endpoint.

### 1g. Risks

- Soft remove changes what "pending" means in the UI and in `send`: every query that lists invitations must exclude `removed` (grep `prisma.invitation` before building).
- Existing `INVITATION` hard-deleted rows before Phase 1 have no history; the report starts at deploy.
- `actorType` NULL on old rows means the audit viewer shows "unclassified" for them; that is honest, and intended.

---

## 2. The sign-in spike

**Time-box: 2 working days. Throwaway branch `spike/family-signin`, never merged**, run against the dev database only. Output is a short written decision (`docs/overhaul/SIGNIN_SPIKE_RESULT.md`), not code to keep.

### 2.1 The question, restated for what Auth0 offers now

With social-only Auth0 and email links built by us, what we actually need to decide is:

1. **Is it worth running a second Auth0 client for families at all** (social sign-in for families)?
2. If yes, **v3 with two `initAuth0` instances, or v4 with two `Auth0Client` instances**?
3. **How does a person move between board and family** with the least friction and no privilege leak?

### 2.2 Facts already gathered (no code run)

- Installed: `@auth0/nextjs-auth0` **3.8.0**, Next **14.2.35**. 10 files import it (5 default, 5 `/client`, 1 `/edge`): the whole migration surface is small.
- Latest v4 is **4.33.0** (npm `latest`). Its peer dependency is `next: ^14.2.35 || ~15.x || ^16`, so **v4 runs on our exact Next 14.2.35** (the floor is `14.2.35`; we are on it, so any Next 14 downgrade would break it, and an upgrade to 14.2.36+ is fine). Peer React `^18`.
- v4 is a rewrite (per Auth0's migration guide and docs, summarized): `Auth0Client` instance from `@auth0/nextjs-auth0/server`; middleware must call `auth0.middleware()`; routes default to `/auth/*` (not `/api/auth/*`); `@auth0/nextjs-auth0/edge` is removed; cookies default `SameSite=Lax`; the session user object keeps only a limited default set of claims; cookie name is configurable through `session.cookie.name`, and Auth0's docs name "multiple Auth0 apps on the same domain" as a reason to rename it. **I found no official statement on running two `Auth0Client` instances in one app**; that is exactly what the spike must prove.
- v3: `initAuth0({...})` returns a separate set of `handleAuth`, `getSession`, etc. with its own config and `session.cookie.name`. `/edge` handling of a second instance is the part I could not confirm.
- Today's project already has the *routing* shape this needs: `middleware.ts` calls the default `getSession` from `/edge` and then fetches `/api/session/board-check` (Node) for the role check.

### 2.3 What the spike builds

| # | Experiment | Pass if |
| --- | --- | --- |
| S1 | **v3 two instances**: `board` (current config) and `family` (a second Auth0 application, own callback `/api/family-auth/callback`, cookie `hoep_family`), social connections only | Signing in to family does **not** produce a board session; `/admin` still redirects; `/portal` rejects a board-only cookie; sign-out of one leaves the other; edge middleware can read each cookie |
| S2 | **v4 two clients** on Next 14.2.35: `auth0Board`, `auth0Family`, distinct `session.cookie.name`, `routes` prefixes and `appBaseUrl`/callback paths, transaction cookie prefixes | Same checks as S1, **plus** `auth0.middleware()` composes for two clients in one `middleware.ts` without one swallowing the other's routes, and `enableParallelTransactions` does not mix the two flows |
| S3 | **Own email link** (no Auth0): token request table, `generateToken`/`hashToken` from `lib/tokens.ts`, `sendLoggedEmail`, 30-minute single-use consume, session table + HttpOnly cookie, Turnstile on the request form, per-IP and per-email rate limit | Link works once; replay fails; expired fails; a request for an unknown email returns **the same response and similar timing** (no account enumeration); the email contains no household data; the session can be revoked server-side |
| S4 | **Multiple-match refusal**: seed two `Patient` rows with the same verified email | Login is refused with a neutral message to the person, **and** a board-visible record is created (audit row `actorType: "system"`, ids only, plus an item for the board). The email is never in the log |
| S5 | **Board to family**: signed-in board session -> "Family page" link -> server mints a family session for **the same `Patient` row only**, `actorType: "family"`, method `board_session` | Cannot be used to open any other household; the audit row says it was minted from a board session |
| S6 | **Family to board**: family session -> "Board admin" link -> `/admin` | Goes through Auth0 login (SSO silent only if an Auth0 session exists); family cookie grants nothing under `/admin` |
| S7 | **Activity log**: every S1 to S6 action writes `actorType` correctly | Matches Phase 1 helper output |

### 2.4 Decision criteria

Score each of S1/S2/S3: works on Next 14.2.35; correct isolation; number of files touched; ongoing risk from SDK internals (v3 is `legacy-v3`, no new features; v4 is current); effort to later move to Next 15; how the 10 existing call sites change.

### 2.5 Recommendation before the spike (to be confirmed or overturned by it)

1. **Phase 2 ships family sign-in with our own email link (S3) and does not use Auth0 for families at all.** Reasons: Auth0 offers only social sign-in, which cannot serve households without a Google/Facebook/Apple account; email links are the stated first release; it keeps the board's Auth0 setup, middleware and allow-list untouched; no new Auth0 MAU for families; one fewer provider to list in the policy.
2. **Keep board on Auth0 v3 for now** (works, stable, Next 14 compatible), **but plan the v4 upgrade as its own later branch**: v4 supports our Next version, v3 is now the legacy line, and the surface is only 10 files. Do it *before* adding a second Auth0 client, never together with it.
3. **If, after launch, families ask for "Sign in with Google/Apple", add it as a second client on v4** (S2), not as a second v3 instance: v4 gives a first-class client object per app and a supported cookie-name option, whereas two v3 instances is the least-documented path. Run S2 only if Stephen wants that option kept alive; otherwise skip S1 and S2 and run S3 to S7 (about one day).
4. **Board to family without a second login (S5)** is solved by our own server-side mint, not by SSO. **Family to board always needs Auth0 login** (one extra sign-in; silent only if the board member already has an Auth0 session). If that friction matters to the board, it is the one argument for a family Auth0 client.

---

## 3. Sign-in behavior to build in Phase 2 (so the spike tests the right thing)

- **Identity match:** by verified email only in the first release (phone later). Normalize with the existing `lib/patients/normalize.ts`. Role `patient` or `board`/`admin` rows can all have family sessions (a board member's own household is the same `Patient`).
- **Zero matches:** neutral "if we have that email we sent a link" response; no account creation (the old `ensurePatientExists` stub creation is **not** ported). People are pointed to `/register-info`.
- **Multiple matches (Stephen's answer 12):** refuse; show the person a neutral message ("We couldn't sign you in automatically. HOEP has been notified"); create a board-visible item. Proposed surface: a flagged banner on `/admin/patients` ("2 sign-in conflicts") listing patient ids and a "merge or fix" link, plus an audit row. **No email or name in the log.** Question 4 asks how the board is notified (banner only, or also an email to the President/VP through `EmailRoute`).
- **Cookies:** HttpOnly, Secure, SameSite=Lax, 30-day server-side session row (hash only), signing out revokes.
- **Never** gate `/rsvp/[token]` or `/confirm/[token]` by session. Those keep working signed-out and signed-in.

## 4. Build order (revised; Stephen's answers applied)

| Phase | Ships | Migration | Notes |
| --- | --- | --- | --- |
| 0 | Policy and consent drafts, attorney questions (this delivery) | none | Wait for attorney and board before any collection starts |
| **1** | Permission `canReviewVerification`; `actorType`; invitation log + soft-remove; per-event report | `AuditLog.actorType`, `Invitation.removed*`, two enum values. **Dev branch only** until approved | Section 1 |
| **1.5 (spike)** | Written decision on sign-in architecture | none (throwaway branch) | Section 2 |
| 2 | Family sign-in by email link + read-only family page; board<->family switch; multiple-match handling; **start Twilio account, brand and campaign registration** (lead time) | Session + login-request tables. **Dev branch only** | Needs policy sections 1.1, 1.2, 1.4, 1.5 live |
| 3 | Self-service edits (household info, consents through new `ConsentRecord` rows) | none expected | Consent v3 only if wording changes |
| 4 | Verification: upload, review queue (President/VP via `canReviewVerification`), delete on decision, purge job; **matching-time gate** for diagnosis-targeted invitations after the 60-day window | `verification_requests`. **Dev branch only** | Needs consent type `verification`, policy 1.3; define window start (Question 5) |
| 5 | Phone sign-in: Twilio Verify, `sms_contact` consent, `phoneVerifiedAt` | consent type, phone-verified column. **Dev branch only** | Verify sends one-time codes without 10DLC per Twilio's docs; any other SMS needs 10DLC (1 to 3 weeks) |
| 6 | Messaging module extraction | none | |
| later | Assistance and scholarships (gated by verification), live events, newsletter | | Deferred by Stephen |

## 5. Questions for Stephen (answer these to approve Phase 1)

1. **Removal notes.** Reason codes only (my default), or also an optional free-text note stored on the invitation row (not in the audit log)? Free text risks someone typing a diagnosis.
2. **Report access.** Is `canManageUsers` (President, VP, admin) right for the invitation report, or do you want a dedicated `canViewInvitationLog`?
3. **Report extras.** Should opening the report write an audit row, and should it have a CSV export? (Defaults: yes to the audit row, no to export.)
4. **Sign-in conflicts.** Board notification by an admin banner only, or also an email to the President and VP through `EmailRoute`?
5. **60-day window.** What starts it for (a) new households, and (b) the households that exist today? My proposal: the date the household is first sent the "family page and verification" notice; existing households start at launch, not at their registration date, and nobody is excluded before the notice has gone out.
6. **Attendance rule stays.** Confirm the gate is only in `matchPatientsForEvent` for events that have diagnosis targeting, and that a household that is unverified after 60 days still gets general invitations.
7. **v3 now, v4 later.** Agree to keep the board on v3 until a separate v4 upgrade branch, and to skip S1/S2 unless you want family social sign-in kept as an option?
8. **Is Auth0 passwordless "not enabled" or "not on your plan"?** If it is only not enabled, I will add it to the spike as S8 (it would let Auth0 send the email link and give true SSO).
9. **Reviewer fallback.** If both President and VP are unavailable, should there be a fallback (an `admin`/superadmin) for review? Today `can()` passes for admins.
10. **Retention numbers.** Confirm 14 days for unreviewed letters, 30 minutes per sign-in link, 30 days per session (used in the policy drafts).

When you approve (or edit) Section 1, I will create `feat/invitation-log`, build 1a to 1e, run tsc against the baseline and the build, run the check script on the dev database only, and hand you the commit messages and merge command.

## 6. Stephen's decisions (2026-11-23), applied

1. Removal reasons are codes only: `ASKED_NOT_INVITED`, `DUPLICATE_HOUSEHOLD`, `MOVED_AWAY`, `NOT_ELIGIBLE_FOR_EVENT`, `CONTACTING_BY_PHONE`, `OTHER`. (Supersedes the lower-case list in 1c.)
2. The report is gated by `canManageUsers`.
3. The 60-day window starts at registration under the new consent text for new households, and at the launch date for existing households.
4. Sign-in conflicts: admin banner plus an email through a new email route `board.duplicates` (default president@ and vicepresident@, editable in Email Routing). The email holds only a link to the admin page: no names, no contact details.
5. Passwordless is not enabled and stays out of the spike. Families use our own magic link.
6. Retention approved: 14 days for unreviewed letters, **30 minutes** per sign-in link (still single use), 30 days per session.
7. Phase 1 order changed: the first commit narrows `canViewPHI` to President and VP (plus admin), because the published policy already says so.
8. Phase 2 (not built yet): the `board.duplicates` email route (default president@ and vicepresident@; editable in Email Routing; the email carries only a link to the admin page) and the admin banner for sign-in conflicts. They are not in Phase 1 because nothing produces a conflict until family sign-in exists.
9. Phase 1 additions beyond the plan: opening the invitation report writes an `INVITATION_REPORT_VIEWED` audit row (default from the plan, no CSV export); a household removed by hand can be put back by hand (same row, logged as `manual_restore`); a household added by hand is logged as `manual_add`.
