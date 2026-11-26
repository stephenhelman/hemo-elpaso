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
| Delete everything | Delete the household in the admin (removes the record, members, consents, RSVPs and check-ins). Delete their messages from HOEP inboxes. Ask Resend to delete their sent emails. Remove any photos they identify. Confirm back, noting backups expire within \[backup window\] |
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

## Phone system (Twilio) console access

Anyone who can sign in to the Twilio console can see callers' numbers and, once voicemail is on, play recordings. Voicemail
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
