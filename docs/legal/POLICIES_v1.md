# HOEP Privacy Policy, Terms of Use & Children's Policy (Draft)

Nov 19, 2026 · @Stephen

## About this draft

These are drafts for board approval and attorney review, written from the site's data inventory of November 19, 2026. They are not legal advice. Texas C-BAR (Community Building with Attorney Resources) matches Texas nonprofits with volunteer attorneys for this kind of review. The Spanish versions should be translated after the board approves the English, so the text is only translated once.

### Decisions this draft assumes

Each is a proposal. Change any of them and the policy text changes with it.

| Topic | What the draft assumes |
| --- | --- |
| Privacy contact | privacy@hemoelpaso.org (forwarding to the President and VP), plus the phone number |
| Response time | Requests answered within 30 days |
| Mailing address | Stays optional; used only to mail event information. Address autocomplete removed from the public form |
| Inactive records | Households with no RSVP or contact for 3 years are contacted, then deleted if there is no reply |
| Logs | Email logs kept 1 year, audit logs 3 years |
| Event links and QR codes | Cleared 30 days after the event ends |
| Unconfirmed adults | Details deleted after 30 days (already automatic) |
| Photos | Reviewed against NO PHOTOS before approval; removed on request |
| Withdrawing consent | Stops all non-essential email; event emails continue only for RSVPs the person keeps |

### Fix in the code before these go live

The policy has to describe what the site actually does. These items from the inventory would make parts of it untrue:

1. Deleting an event must also delete its photos and flyers from storage. Today public photo links stay live.
2. Remove Google address autocomplete from the public registration and RSVP forms.
3. Limit attendee emails and phone numbers on the stats and attendance pages (and their CSV) to President and VP. Fix the CSV's "privacy-safe" label.
4. Confirm the Auth0 board-only login rule is live, not just drafted.
5. Add an expiry rule for temporary photo uploads, and confirm unapproved photos are not publicly reachable.
6. Implement the retention schedule above (scheduled cleanup jobs).
7. Make withdrawing consent stop all non-essential email, as the policy promises.
8. Add consent text version v2 that mentions health information and links to the privacy policy. Decide whether v1 households re-confirm.
9. Turn off Resend open and click tracking.
10. Confirm the dormant tables from cut features hold no real data in production. Delete any real legacy files (diagnosis letters, assistance documents) from storage.
11. Make a missing unsubscribe secret a hard failure in production.
12. Update CLAUDE.md, which still says the site is not in production.

## Privacy Policy

*Hemophilia Outreach of El Paso (HOEP). Effective \[date\]. Version 1.*

HOEP is a nonprofit that supports families affected by bleeding disorders in the El Paso area. This policy explains what information we collect through our website and events, why, who can see it, how long we keep it, and the choices you have. We never sell your information.

### Information we collect

**When you register your household:**

- Your name, email address and/or phone number, and preferred language (English or Spanish).
- Your mailing address, if you choose to give it.
- The people in your household: first name (last name optional), relationship to you, and age group. We do not ask for dates of birth.
- If you choose to tell us, whether you or a child in your household has a bleeding disorder, and which one (for example, hemophilia A, hemophilia B, or von Willebrand disease). This is health information, and we treat it with extra care.
- Your consents and when you gave them (see "Your consents" below).

**Adults in your household** are asked to confirm their own information. If you list someone 18 or older, we email them once with a private link, or call them if they have no email. They decide for themselves whether to share health information and whether to consent. If they don't confirm within 30 days, we delete what you entered about them, except a note that your household includes one more adult.

**When you RSVP or attend an event:** who in your household is coming, the number of guests, and who checked in.

**When you contact us:** your name, email, phone (optional), and your message. Contact-form messages are sent to HOEP's email inbox and are not stored in our database. Please don't include medical details in a contact message; we will follow up privately.

**When you visit the website:** we use privacy-friendly page-view statistics that do not use cookies or identify you. We store one cookie to remember your language choice. Our hosting provider sees standard technical information, such as your IP address, to deliver the site.

**Photos:** HOEP may take photos at events. Photos are only published for people who consented to photo use (see below).

### How we use it

- To invite you to events. Some events are for specific groups, such as families affected by a particular condition or children of a certain age, so we may use your household's information to decide which invitations to send you. Invitations never mention a diagnosis.
- To manage RSVPs, send confirmations and reminders, and check people in at events.
- To answer your messages.
- To improve our programs, using overall counts (for example, how many families attended).

We do not use your information for advertising, and we do not sell, rent or trade it.

### Who can see it

Only HOEP board members who need it for their role can see your information, and access is limited by role. Health information is visible only to the President, Vice President, Secretary and Treasurer. Board members sign in with secure accounts, and access to records is logged.

We use trusted service providers to run the website. They process information only to provide their service to HOEP:

| Provider | What it does for HOEP |
| --- | --- |
| Vercel | Hosts the website; privacy-friendly page-view statistics |
| Neon | Stores our database |
| Resend | Sends our emails |
| Cloudflare | Stores event photos; protects our forms from spam bots |
| Auth0 | Board member sign-in |
| Sanity | Manages public website content (no family information) |
| Google | Shows a map on our contact page |

We may share information if the law requires it, or to protect someone's safety.

### Your consents

When you register, you agree that HOEP may keep your information and contact you about events and services. Photo and video consent is separate and optional. You can change either at any time by contacting us. Withdrawing consent stops invitations and other non-essential email. If you have an active RSVP, we will still send that event's confirmation and reminder unless you cancel the RSVP.

Every invitation email also has an unsubscribe link.

### Children

Only adults (18 or older) can register. A parent or legal guardian may include their minor children and their information. Read our Children and Age Policy for details.

### How long we keep it

| Information | How long |
| --- | --- |
| Your household record | While you're involved with HOEP. If there's no RSVP or contact from you for 3 years, we'll reach out, and delete it if we don't hear back |
| An unconfirmed adult's details | 30 days, then deleted |
| Event links and QR codes | Until 30 days after the event |
| Email delivery records | 1 year |
| Access logs | 3 years |
| Contact-form messages | In HOEP's inbox until the matter is resolved |
| Published photos | Until we remove them, including on request |

Deleted information may remain in secure backups for a limited period \[backup window, e.g. up to 30 days\] before it is permanently erased.

### Your choices and rights

You can ask us to:

- Tell you what information we have about you and your household.
- Correct it.
- Delete it, completely.
- Remove a photo of you or your child from our website or social media.
- Stop contacting you.

Contact us at \[privacy@hemoelpaso.org\] or \[(915) 539-7353\]. We may ask a question to confirm it's really you, and we will respond within 30 days.

### Security

We protect your information with encrypted connections, restricted access for board members, private links that can't be guessed, and by never putting health information in emails, links or QR codes. No system is perfectly secure; if a breach affected your information, we would notify you as the law requires.

### Changes to this policy

If we change this policy, we'll post the new version here with a new effective date. If a change affects how we use information you already gave us, we'll ask for your consent again.

### Contact

Hemophilia Outreach of El Paso · El Paso, Texas · \[privacy@hemoelpaso.org\] · \[(915) 539-7353\]

## Terms of Use

*Hemophilia Outreach of El Paso (HOEP). Effective \[date\]. Version 1.*

By using hemoelpaso.org you agree to these terms. If you don't agree, please don't use the site.

### Not medical advice

Information on this site, including about bleeding disorders, treatment centers and programs, is for general education only. It is not medical advice and does not replace your doctor or hemophilia treatment center. In an emergency, call 911.

### Registering and RSVPs

- You must be 18 or older to register, and the information you give must be accurate.
- Only register people you are allowed to: yourself, minors you are the parent or legal guardian of (or have their guardian's permission for), and other adults in your household, who will be asked to confirm for themselves.
- Your RSVP and invitation links are private. Please don't share them; anyone with the link can view or change that RSVP.
- Events can have limited space. RSVPs are first come, first served, and HOEP may change or cancel an event. We will let RSVPed families know.

### At our events

HOEP may take photos and video at events. We publish images only of people who consented to photo use. If you see an image of you or your child that you want removed, contact us and we will take it down.

### Acceptable use

Don't use the site or its forms to send spam, advertising or harmful content, to try to access information that isn't yours, or to interfere with how the site works. We may block submissions that break these rules.

### Links to other websites

We link to other organizations, such as national bleeding disorder foundations and local providers. We aren't responsible for their content or privacy practices.

### HOEP's content

The HOEP name, logo and site content belong to HOEP. You may share our pages and event information for non-commercial purposes; please don't alter our logo or use it to suggest HOEP endorses something.

### No warranty

We work to keep the site accurate and available, but it is provided "as is", and we can't promise it will always be error-free or online. To the extent the law allows, HOEP is not liable for losses from using the site.

### Governing law

These terms are governed by the laws of the State of Texas.

### Changes

We may update these terms. The current version and its effective date will always be on this page.

### Contact

&#91;privacy@hemoelpaso.org\] · \[(915) 539-7353\]

## Children and Age Policy

*Hemophilia Outreach of El Paso (HOEP). Effective \[date\]. Version 1.*

Many of the families HOEP serves have children with bleeding disorders, so we take extra care with children's information. Children never use our forms themselves; a parent or guardian provides their information.

### Who can register

Only adults 18 or older can register with HOEP or RSVP to events. Everyone who registers confirms that they are 18 or older. This website is not directed to children, and we do not knowingly collect information directly from anyone under 18. If we learn a child registered themselves, we will delete that registration and, where we can, contact a parent or guardian.

### Children in a household

When you register, you may list children under 18 in your household. You confirm that you are their parent or legal guardian, or that you have their guardian's permission. For each child we collect only:

- First name (last name optional)
- Relationship to you
- Age group (0–5, 6–12 or 13–17), not a date of birth
- If you choose to tell us, whether they have a bleeding disorder, and which one

We use this to invite your family to events that fit your children, such as youth programs and camps, and to check your family in at events. We never put a child's health information in an email, link or QR code.

### Adults in a household

An adult in your household speaks for themselves. You may list them, but we ask them directly to confirm their information and give their own consent. You cannot share another adult's health information. If they don't confirm within 30 days, we delete what you entered about them.

### Photos of children

We publish photos of children only when their parent or guardian has consented to photo use. At events, board members can see which families declined, so those children are not included in published photos. A parent or guardian can ask us to remove a photo of their child at any time, and we will take it down promptly.

### When a child turns 18

The age group you entered does not update automatically. When a child in your household turns 18, please let us know. As an adult, they will be asked to confirm their own information and consent, and any information about them that they don't confirm will be removed.

### Your rights as a parent or guardian

You can review, correct or delete your children's information at any time, and withdraw photo consent, by contacting us at \[privacy@hemoelpaso.org\] or \[(915) 539-7353\]. We respond within 30 days.

## Internal runbook: privacy requests

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

## Questions for the attorney

1. **Texas Health & Safety Code chapter 181.** Does HOEP's collection of self-reported diagnoses make it a "covered entity" under Texas's medical records privacy law? If so, what does it require of us (training for board members who handle the data, notices, breach procedures)?
2. **HIPAA.** Confirm it doesn't apply, since HOEP isn't a health care provider or health plan and doesn't bill for care.
3. **Children.** Is the parent/guardian attestation enough for children's information and photos, or is more needed?
4. **Email.** Do event invitations count as commercial email under CAN-SPAM? If so, must they include a postal address, and is HOEP's unsubscribe link enough?
5. **Browser-side services.** Is disclosure in this policy enough for the Cloudflare bot check, the Google map and the board sign-in service, or do we need a cookie notice?
6. **Consent records.** Families who registered under consent version v1 (before this policy existed): do they need to re-confirm under v2?
7. **Breach notification.** What would Texas law require us to do, and by when, if this information were exposed?
8. **Bilingual policies.** Should the English and Spanish versions both be legally binding, and what happens if they differ?
