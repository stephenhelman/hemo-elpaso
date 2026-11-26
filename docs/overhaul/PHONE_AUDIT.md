# Phone system: audit, decisions and plan

Audit date: 2026-11-25 (read-only, from the code and a few web searches). Decisions added the same day.

Phases: (1) main number with a bilingual menu, call forwarding and voicemail; (2) a browser dialer for board members
with HOEP caller ID, outcomes logged; (3) SMS reminders after 10DLC approval, only to households with texting consent;
(4) a standing conference line and officer numbers.

## Decisions

These override anything in the audit below that says otherwise.

| Topic | Decision |
| --- | --- |
| Menu | 1 events (English), 2 Spanish, 3 officer. Options 1 and 2 ring the assigned person, then voicemail. No recorded event information. |
| Number | **(915) 539-7353 does not move.** It is an officer's personal number. HOEP gets a new Twilio number. Removing 539-7353 from the site is a cutover task (`CUTOVER.md`). |
| Voicemail retention | 30 days. |
| Duty numbers | admin@ adds, verifies and removes them. |
| Duty swaps | President and Vice President may change who is on duty, among already-verified board members only. Every swap is audited and emails all four officers. |
| Numbers on screen | Masked everywhere. |
| `canUseDialer` | Not health data. Default President and Vice President; assignable to Secretary and Treasurer (reviewer tier). |
| `canListenVoicemail` | Health data (`phi`): President and Vice President only. |
| Twilio console | vicepresident@ (owner, 2FA) and president@. admin@ has none. Recorded in `docs/legal/RUNBOOK.md`. |
| Screening | "Press 1 to accept" on every forward. |
| Outage | A Twilio-hosted fallback (TwiML Bin), documented in `TWILIO_SETUP.md`. |
| Build order | `fix/phone-prereqs`, `feat/twilio-foundation` (A), `feat/phone-ivr` (B). Voicemail (C) and policy v3 (D) after A and B are reviewed. |

## Findings fixed before the phone work (`fix/phone-prereqs`)

1. A household merge moved neither `invitation_call_logs` nor `rsvp_requests`; both were deleted with the merged record
   12 months later.
2. The call list's "invited" group ignored withdrawn contact consent.
3. Texting consent was not tied to a phone number. It is now (`consent_records.phoneNumber`). **Yes answers recorded
   before this change cover no number**: those families have to agree again before they can be texted.
4. `CLAUDE.md` said the build ignores type errors. It does not.

## 1. Email routing: reuse the pattern, not the table

Reused: pure `definitions` and `change` modules with injected side effects, a save and its audit entry in one
transaction, officer notice on every change, rate-limited test action, admin-only permission locked in the matrix.

Not reused: the `email_routes` table (its validation rejects anything off the mail domain), copying values and names
into the audit log (phone numbers must never go there), free-typed destinations.

- Storage: one JSON row in `app_settings` (`phone.routing`).
- Permissions: `canManagePhoneRouting` (settings, admin only) and `canSwapPhoneDuty` (locked to President and VP).
- Destinations: board members with an active role, each number verified by a call. US `+1` only; never HOEP's own
  number, N11 or premium numbers.
- Email routing keeps mail out of personal inboxes. Forwarding has to reach personal phones, so screening and
  verification are the safeguards instead.
- Weekly hours per menu option, in `America/Denver`.

## 2. Public webhooks

- `src/middleware.ts` runs only on its matcher, which holds no `/api/twilio` path, so those routes are public. Keep it so.
- One wrapper for every Twilio route: validates `X-Twilio-Signature` and the account SID, answers 403 otherwise.
- The signature is checked against the configured public URL. Point Twilio at exactly `https://hemoelpaso.org/...`:
  the www and old-domain 308 redirects apply to `/api` too.
- No timestamp is signed, so writes must be idempotent (`CallSid`, `RecordingSid`).
- Never log `From` or `To`; only codes in query strings.
- There is no shared rate limiter; existing limits count database rows. IP limits don't help (Twilio is the caller).
  Use per-caller and daily caps (voicemail), a maximum call length, US-only geographic permissions, spending alerts,
  and optionally a Vercel firewall rule.

## 3. Call logs and the dialer (phase 2)

- Call list: the button goes next to the `tel:` link in `InvitationsManager`.
- Household page: `invitation_call_logs.eventId` is required. Don't relax it; add a `phone_calls` table for all dialer
  calls and write an invitation log only when there is an event.
- `logCall` already accepts `source: "dialer"` and `providerCallId`; the API route passes neither.
- The browser sends a household id, never a number. The server looks it up, records the `CallSid`, and checks it
  belongs to that user and household before saving an outcome. One log per `CallSid`. Require a strict `+1` number.

| Action | President / VP | Secretary / Treasurer | Other board | admin@ |
| --- | --- | --- | --- | --- |
| Invitation call list (`canManageEvents`) | yes | no | no | no |
| Household page (`canManageUsers`) | yes | no | no | no |
| Dialer (`canUseDialer`) | yes (default) | assignable | no | no |
| Voicemail (`canListenVoicemail`) | yes | no | no | no |
| Duty swap (`canSwapPhoneDuty`) | yes | no | no | no |
| Phone settings (`canManagePhoneRouting`) | no | no | no | yes |

Open for phase 2: the Secretary and Treasurer cannot open the invitation call list or household page today, so
assigning them `canUseDialer` needs a screen they can use, and the policy sentence about what they may see.

## 4. Voicemail (phase C)

- Keep recordings in Twilio. The R2 bucket is served on a public domain, so audio must never go there.
- Require HTTP authentication on recording media.
- Anyone with the Twilio console can play recordings, hence the console decision above.
- Play through `/admin/voicemails` and an authenticated proxy (`/api/admin/voicemails/[id]/audio`): permission check,
  range requests (Safari), `private, no-store`, each play audited. No signed URLs.
- Store ids, mailbox, language, duration, encrypted caller number, a keyed hash for limits, and listened, handled and
  deleted times.
- Delete after 30 days from the retention cron: Twilio first, then mark the row; retry failures; sweep recordings that
  have no row. Manual delete too.
- Email a new `phone.voicemail` route limited to president@ and vicepresident@: a link only. No number, name, audio or
  transcript. Transcription stays off.
- Greeting: it is recorded, leave out medical details, call 911 in an emergency. 120 seconds maximum.
- Live calls are not recorded.

## 5. TWILIO_MODE

| Mode | Behaviour |
| --- | --- |
| `live` | Default only when `VERCEL_ENV=production`; refused anywhere else |
| `capture` | Default elsewhere. No Twilio requests; nothing rings |
| `allowlist` | A development account or subaccount; only `TWILIO_DEV_ALLOWLIST` numbers can be reached |

- Test credentials cover only a few REST resources and don't fetch webhooks.
- TwiML is also outbound: a `<Dial>` from a development webhook rings a real phone. The TwiML builder applies the mode.
- The production account is refused outside production.
- An invalid mode stops the app. Missing credentials stop only the phone routes.
- `check:twilio-guard` enforces the one-module rule.

## 6. SMS (phase 3)

- Consent: `consent_records` type `sms`, append-only, wording v3 and v4. Collected unchecked at registration; officers
  record it for the primary; the family page can also record it for an adult member once the toggle is on (officers
  can't, today: decide before phase 3).
- `phoneCanText` describes the phone, not consent.
- Proposed eligibility: newest `sms` record is a yes **for the current number**, contact consent not withdrawn,
  `phoneCanText` is yes, number not opted out, toggle on.
- STOP and HELP: Messaging Service with Advanced Opt-Out for Spanish keywords (ALTO, PARAR, AYUDA; only Twilio support
  can turn it off again). Store opt-outs by number and add a refusal for every match. START lifts the block but creates
  no consent. Store no message bodies.
- Quiet hours (Denver): send 9 a.m. to 8 p.m. Monday to Saturday, noon to 8 p.m. Sunday. Sources disagree on whether
  Texas calling hours cover consented texts: ask the attorney.
- The email reminder cron runs at 14:00 UTC (7 or 8 a.m. in El Paso). Texts need their own cron and "sent" column.
- No event titles or virtual links in texts.
- The consent wording mentions sign-in codes: drop it or include it in the 10DLC campaign.
- 10DLC: EIN matching IRS records, privacy and terms URLs, vetting and monthly fees (confirm current pricing).

## 7. Toggles and policy (phase D)

| Key | Phase | Off means |
| --- | --- | --- |
| `phone_system` (new) | 1 | Calls forward to one fallback number; no recording |
| `phone_dialer` (new) | 2 | No call buttons, no tokens |
| `sms` (exists) | 3 | Nothing sends; STOP is still processed |
| `phone_conference` (new) | 4 | The line plays "unavailable" |

Off must never mean the number stops answering, including when flags can't be read. New keys need policy version 3,
a bumped `LIVE_POLICY_VERSION`, a `VOICEMAIL_RETENTION` placeholder and the key list in `check-features`.

Draft paragraphs (Spanish ships in the same change):

- **Phone calls.** When you call us, we and our phone provider receive your number, the time and length of the call and
  the option you choose. We connect you to the board member assigned to answer. We don't record live calls.
- **Voicemail.** If you leave a message, our phone provider stores the recording. Only the President and Vice President
  can listen to it. We delete it after 30 days or sooner. We don't transcribe it or attach it to email. Please leave
  out medical details. In an emergency, call 911.
- **Calls from our board.** Board members may call you from our website using HOEP's number. We keep who called, when
  and the result, such as reached or left a message.
- **Text messages** (replaces the current one). If you agree, we text your mobile number about events, reminders and
  announcements. Message frequency varies and message and data rates may apply. Reply STOP to stop or HELP for help.
  You don't have to agree to take part in HOEP. We don't share your mobile number or text consent with anyone for their
  marketing. Our texts don't include health information.
- **Conference line.** We don't record conference calls.

Retention rows: voicemails 30 days; call records 1 year (proposed); text delivery and opt-out records to be set with the
attorney. Vendor row: "Twilio: answers and connects our calls and stores voicemails {STATUS:phone_system}; browser calls
{STATUS:phone_dialer}; text messages {STATUS:sms}; conference line {STATUS:phone_conference}". Also update the terms
(text program), `DATA_INVENTORY.md` and `RUNBOOK.md`.

## 8. Plan and risks

| Branch | Contents |
| --- | --- |
| `fix/phone-prereqs` | The four fixes above |
| `feat/twilio-foundation` (A) | `src/lib/twilio/` (mode, config, client, webhook, TwiML), guard and webhook checks |
| `feat/phone-ivr` (B) | `src/lib/phone/`, `/api/twilio/voice/*`, Phone settings, duty swaps, routing check |
| C, voicemail | Table `phone_voicemails`, recording webhook, playback, retention, notice |
| D, policy | Policy v3, `phone_system` toggle, data inventory, runbook |
| E, cutover | Test on the new number, then publish it; remove 539-7353; toggle on after D is live |

Until D is live, don't give the number to families. Until C is merged, an unanswered call plays a "call again" message.

| Risk | Mitigation |
| --- | --- |
| Outage or bad deploy | Twilio fallback, written rollback |
| A message lands in a personal voicemail | Press-1 screening |
| An urgent medical call goes unanswered | 911 line first; this is not a medical line |
| Recordings reachable beyond President and VP | Console access rule, media authentication, proxy |
| Development rings real people | Mode-aware TwiML, separate account, allowlist |
| Toll fraud or spam | Geographic permissions, caps, alerts |
| Protected preview deploys can't receive webhooks | Local tunnel |
| 10DLC delays phase 3 | Register early, after policy and terms are live |
| Legal status of health information; Texas rules | Add to `ATTORNEY_QUESTIONS.md`. Whether HIPAA applies was not determined |

## Sources

- <https://www.twilio.com/docs/iam/test-credentials>
- <https://www.twilio.com/docs/messaging/tutorials/advanced-opt-out>
- <https://www.twilio.com/en-us/changelog/opt-out-additional-keywords-added-per-fcc-ruling>
- <https://twilio.com/content/dam/twilio-com/global/en/other/hipaa/pdf/Architecting-for-HIPAA.pdf>
- <https://support.twilio.com/hc/en-us/articles/1260803965530>
- <https://www.twilio.com/en-us/changelog/a2p-10dlc-campaign-registration-will-require-privacy-policy-and->
- <https://commlawgroup.com/2025/texas-senate-bill-140-registration-and-compliance-requirements-for-telephone-solicitation/>
- <https://www.ecomm-alliance.org/downloads/texas_sb_140_webinar.pdf>
