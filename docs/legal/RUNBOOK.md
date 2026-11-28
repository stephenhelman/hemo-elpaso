# Internal runbook: privacy requests

For board use only, not published. Every request is handled by the President or VP within 30 days, and logged in a simple request log (date received, type, date completed, who handled it; no health details).

### Every request starts the same way

1. Reply within 2 business days to acknowledge it.
2. Confirm identity: the request must come from the email or phone on file, or the person must answer a question only they would know (for example, who is in their household). Never confirm what HOEP holds until identity is confirmed.
3. A request about a child must come from the parent or guardian on the household record. A request about an adult household member must come from that adult.

### Request types

| Request | Steps |
| --- | --- |
| See my information | Open the household in the admin. Send a plain summary of what's on file. Leave out board notes and logs |
| Correct it | Edit the household record. Confirm back to them |
| Delete everything | Delete the household in the admin (removes the record, members, consents, RSVPs and check-ins). Delete their messages from HOEP inboxes. Delete their voicemails (below; this is separate). Ask Resend to delete their sent emails. Remove any photos they identify. Confirm back, noting backups expire within \[backup window\] |
| Delete my voicemails | See "Deleting a caller's voicemails" below. Confirm back |
| Remove one household member | Use Remove member on the household page. Confirm back |
| Remove a photo | Find it in the event's photos and delete it (unapprove is not enough). Check social media posts too. Confirm back |
| Stop contacting me | Record withdrawn contact consent on the household page. Cancel future RSVPs if they ask. Confirm back |
| Withdraw photo consent | Record withdrawn media consent. Ask whether existing photos should come down too |

### After every request

Log the completion date. If anything couldn't be done (for example, a copy held by a service provider), tell the person plainly what remains and when it will be gone.

## Where each step is in the admin (as built)

| Runbook step | Admin action |
| --- | --- |
| See / correct | Admin → Patients → open the household (edit form, household panel, consent history) |
| Delete everything | Patients → household → "Delete" panel (type DELETE). Cascades to members, consents, RSVPs, check-ins |
| Remove one household member | Household panel → "Remove member" |
| Remove a photo | Event → Photos → trash icon (deletes both sizes from storage). Deleting a whole event now deletes all its photos and flyers too |
| Stop contacting me | Patients → household → untick "Data and contact" consent and save (records a withdrawal). Then "Cancel RSVP" next to each upcoming RSVP if they ask (no email is sent) |
| Withdraw photo consent | Primary: untick "Photos" consent and save. Confirmed adult member: "Withdraw photo consent" in the household panel |
| Inactive households (3 years) | Admin → Inactive households: "Mark contacted", then "Delete" if there is no reply |

Withdrawn contact consent blocks invitations and every other non-essential email (`src/lib/email/policy.ts`). RSVP confirmation and reminder emails for an RSVP the person keeps still go out unless the RSVP is cancelled.

## Deleting a caller's voicemails

Voicemail is not linked to a household, so deleting a household does not delete it. The President or Vice President:

1. Confirms the request comes from that person: they call from the number, or HOEP calls them back on it. Never say what
   a message contains to anyone else.
2. Admin → **Voicemail** → "Find a caller's messages": type their number (outside the US, with + and the country code)
   → **Find**. Repeat for every number they may have used.
3. Messages left with the number hidden, or before `PHONE_DATA_KEY` was changed, are not found by number: look through
   the list by date and play the ones that could be theirs.
4. **Delete these** (or Delete on each). The site deletes at Twilio first. If it says the provider did not answer, the
   message is still there: try again later. Don't confirm until it is gone from the list.
5. Remove the "New voicemail" emails if you wish: they hold only a link, no caller details.
6. Call records (number, time, length) stay at Twilio for up to 1 year. If the person asks for those to go too, ask the
   developer to delete them through Twilio.
7. Confirm back and log the request (date, type, done by; no health details).

If a message must be kept (a complaint, an incident, a legal request), ask the attorney before day 29: the daily job
deletes it, and there is no "keep" button.

## Voicemail: day to day

- Play, mark handled and delete in Admin → Voicemail. Every play, and every number shown, is recorded in the audit log.
- To return a call, press **Show number** on the message (each view is recorded). If the number is hidden, use the one
  the caller said in the message. The greeting asks for it.
- Don't download, forward, record or transcribe a message. Write down only what you need to return the call, and don't
  save the number or copy it into email or chat.
- If the page warns that recordings are not protected, or that messages are past 30 days, fix it that day
  (`docs/overhaul/TWILIO_SETUP.md`).

## Turning the phone menu off

admin@ → Settings → Feature toggles → "Phone line". Off: calls skip the menu and ring the fallback number (they must
press 1), or the caller hears a notice with the website and email. Nothing is recorded. Messages already left stay on the
Voicemail page and are still deleted on schedule. The officers are emailed about the change.

## Phone system (Twilio) console access

Anyone who can sign in to the Twilio console can see callers' numbers and play recordings. Voicemail
can contain health information, which the Privacy Policy limits to the President and Vice President. So:

| Account | Twilio console |
| --- | --- |
| vicepresident@hemoelpaso.org | **Owner**, with two-factor authentication |
| president@hemoelpaso.org | User, with two-factor authentication |
| admin@hemoelpaso.org | **No access** (the settings account never holds family data) |
| Everyone else | No access |

- No shared logins. Add each person as a user of the account; both turn on two-factor authentication.
- When the President or Vice President changes: add the new officer, remove the former one, then create a new auth token
  (and API key) and update them in Vercel. If the Vice President leaves, move ownership first.
- Review the user list once a year and whenever officers change.
- The auth token and API key live only in Vercel's Production environment variables. Whoever pastes them there can read
  the account through the API, so treat that as the same access: the President or Vice President enters them.
- Changing who is on phone duty needs no Twilio access: that is done in the site (Settings → Phone).
