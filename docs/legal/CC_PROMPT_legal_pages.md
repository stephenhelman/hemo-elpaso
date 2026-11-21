# Claude Code prompt: legal pages, consent v2, and privacy fixes

Branch: `feat/legal-pages` off `main`. Follow `.claude/CLAUDE.md` Overhaul rules. Do not commit. At the end of each phase, give me the commit message only.

## Source material

- `docs/legal/DATA_INVENTORY.md`: your audit from earlier.
- `docs/legal/POLICIES_v1.md`: the board-approved policy text, which I'm adding to the repo. It has six sections. **Privacy Policy**, **Terms of Use** and **Children and Age Policy** are the public text. **Internal runbook** and **Questions for the attorney** are internal only and are never published. **About this draft** lists the code fixes.

Use the approved English wording as written. If something in the code makes a sentence untrue, don't reword the policy yourself. Report the mismatch and stop (see Phase 0).

## Phase 0: verify before building (read-only)

Report on each item. Stop after Phase 0 only if item 1 or 2 is false. Otherwise report and continue.

1. **Who can see diagnoses.** The policy says health information is visible only to President, VP, Secretary and Treasurer. List every permission, page, API route and export that shows or returns diagnoses (patient, household member and contact profile, in all three storage places), and the roles that pass each one.
2. **Invitations.** The policy says invitations never mention a diagnosis. Check the invitation email templates (EN and ES), subject lines, event titles and descriptions as they appear in invitations, and the matching UI that composes them. Also check that no email, URL or QR payload contains health info.
3. **Neon backup window.** Find the history retention (point-in-time restore) for our Neon plan from the repo or docs. If you can't tell, say so and I'll check the dashboard. This fills the `[backup window]` placeholder.
4. **Privacy contact.** `privacy@hemoelpaso.org` does not exist yet (the domain transfer is pending). Tell me which inbox the contact-form notification currently goes to.
5. **Dormant data (inventory #8, #10).** Run read-only row counts in production for every table belonging to cut features (disorder_profiles, assistance and the others the inventory listed), via the db-guard path. List the R2 prefixes that hold legacy files and their object counts. Delete nothing.
6. **Runbook actions.** Confirm the household admin page has the actions the runbook relies on: delete household, remove one member, and record withdrawn contact consent and media consent. List any that are missing.

## Phase 1: legal pages with a print-friendly version

1. Put the policy text in code, not Sanity, so every change is versioned in git. Create `src/content/legal/` with `privacy.ts`, `terms.ts` and `children.ts`. Each exports `{ version: "1", effectiveDate, en, es }`, with the body as structured sections (headings, paragraphs, lists, tables) rather than raw HTML.
   - Set `effectiveDate` to a single constant that I'll set on deploy day.
2. Add the constants `PRIVACY_EMAIL` and `SITE_URL` to `lib/site.ts`. Set `PRIVACY_EMAIL` to the inbox from Phase 0 item 4 for now, with a comment to switch it to privacy@hemoelpaso.org after the domain move. The `[privacy@…]` and `[(915) 539-7353]` placeholders render from `PRIVACY_EMAIL` and `SITE_PHONE`. "hemoelpaso.org" in the Terms renders from `SITE_URL`'s host.
3. Write the Spanish versions yourself, in plain, warm, neutral Latin American Spanish suited to families. Add every legal string to `docs/overhaul/ES_REVIEW.md` under a new "Legal pages" heading so a native speaker can review them. The English text controls if the two differ; add one sentence saying so to the bottom of each Spanish page.
4. Add the routes `/privacy`, `/terms` and `/children`. They use the existing locale handling, a readable max width, the brand type and colors, and real tables for the provider and retention tables. Each page shows its version and effective date under the title.
5. **Print-friendly version:**
   - Add a "Print / Save as PDF" button (EN/ES) at the top of each page that calls `window.print()`.
   - Add `@media print` styles:
     - Hide the navbar, footer, language switcher and buttons.
     - Black text on white; links underlined with their URL printed after the text (only external links and the mailto).
     - A print-only header with the logo, "Hemophilia Outreach of El Paso", the page title, the version and effective date, and the page URL.
     - `break-inside: avoid` on table rows, list items and heading-plus-first-paragraph.
     - Letter size with sensible margins and page numbers via `@page` where browsers support it.
   - It prints in whichever language is showing.
   - Test print preview in Chrome and Safari (desktop and iPhone share sheet), and tell me what you checked.
6. Add a small `/legal` index page linking all three pages, with a print button for each.
7. **Links:**
   - Footer: Privacy, Terms, Children's Policy.
   - Registration form: next to the consent checkboxes.
   - The 18+ attestation: links the Children's Policy.
   - RSVP page, `/confirm/[token]` page and contact form: a privacy link.
   - Footer of every outgoing email template: privacy link.
8. Add `/privacy`, `/terms`, `/children` and `/legal` to the sitemap.

## Phase 2: consent v2

Only Stephen's test household exists under v1, so no re-confirmation flow is needed.

1. Add version `v2` to `src/content/consent.ts`. Keep `v1` in the file, unchanged, for historical records. New consents record `v2`.
2. The v2 text keeps the current order (18+ attestation, data and contact, media) and the approved meaning, and adds:
   - The data and contact consent covers health information about me and the minors I list.
   - It names the privacy policy, with a link.
   - I can withdraw at any time.
3. Write the v2 text as a draft in EN/ES, put it in your report for my approval, and add it to ES_REVIEW.md. Do the same for the adult self-confirmation variants on `/confirm/[token]`.

## Phase 3: code fixes the policy depends on

Inventory references are in brackets.

1. **Event delete cleans storage [#11].** Deleting an event deletes its R2 photos (all prefixes) and flyers, then the rows. Log failures. Also add an admin action to delete a single photo from R2 (the runbook says "unapprove is not enough").
2. **No Google Places on public forms [#2].** Replace the autocomplete with plain address fields on registration and RSVP. Keep it on admin forms if it's used there.
3. **Attendee PII [#24].** Emails and phone numbers on the stats and attendance pages and in `AttendeeListExport` are visible to President and VP only. Other `canViewEventStats` roles see names, counts and NO PHOTOS only. Fix the "PRIVACY-SAFE" label so it's accurate for each role, and enforce the same split in the API.
4. **Unapproved photos [#5].** Confirm photos-pending and uploads/tmp objects aren't reachable from a public URL, and proxy them through an authenticated admin route if they are. Write the R2 lifecycle rule (uploads/tmp expires after 1 day) as a dashboard step for me.
5. **Retention [#14].** Add one daily cron, `/api/cron/retention`, in Vercel config at a quiet time (UTC), protected the same way as the existing crons. It:
   - clears RSVP/invitation/check-in tokens, including the AES copy, for events that ended more than 30 days ago;
   - deletes email_logs older than 1 year and audit_logs older than 3 years;
   - flags households with no RSVP, check-in or update in 3 years (computed, no migration if you can avoid one) and lists them on an admin page "Inactive households", for President and VP, with "Mark contacted" and "Delete" actions. Never delete automatically.
6. **Withdrawal [#7 in About this draft].** Withdrawn data_and_contact consent blocks invitations and any other non-essential email. RSVP confirmation and reminder emails for an RSVP the person keeps still send. The matcher excludes withdrawn households. Add tests.
7. **Unsubscribe secret.** In `unsubscribe-token.ts` there is a "dev-secret" fallback. Throw in production if the secret is missing.
8. **Contact form notice.** Add a line above the message field: "Please don't include medical details; we'll follow up privately." (EN/ES).
9. **Runbook gaps.** Add any admin actions Phase 0 item 6 found missing.
10. **Docs.** Copy the Internal runbook section into `docs/legal/RUNBOOK.md` and the attorney questions into `docs/legal/ATTORNEY_QUESTIONS.md`. Update `.claude/CLAUDE.md`, which still says the site is not deployed to production: registration is live.

Migrations, if any are unavoidable, go to the dev branch only, with `db:whoami` confirming dev first. Tell me before writing one.

## Final report

- Phase 0 findings.
- The v2 consent draft (EN/ES).
- The files changed, per phase, with a commit message for each phase.
- A test checklist I can run locally, including print previews.
- A **dashboard checklist** of what I must do by hand:
  - Resend: open and click tracking off on the sending domain.
  - Auth0: confirm the board Post-Login Action is deployed and in the Login flow [#27].
  - R2: lifecycle rule for uploads/tmp.
  - Vercel: confirm the new cron appears after deploy.
  - Delete any legacy R2 files with real data, per the Phase 0 list.
  - Set `effectiveDate`.
