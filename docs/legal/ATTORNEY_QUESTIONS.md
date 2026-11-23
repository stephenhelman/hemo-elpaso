# Questions for the attorney

1. **Texas Health & Safety Code chapter 181.** Does HOEP's collection of self-reported diagnoses make it a "covered entity" under Texas's medical records privacy law? If so, what does it require of us (training for board members who handle the data, notices, breach procedures)?
2. **HIPAA.** Confirm it doesn't apply, since HOEP isn't a health care provider or health plan and doesn't bill for care.
3. **Children.** Is the parent/guardian attestation enough for children's information and photos, or is more needed?
4. **Email.** Do event invitations count as commercial email under CAN-SPAM? If so, must they include a postal address, and is HOEP's unsubscribe link enough?
5. **Browser-side services.** Is disclosure in this policy enough for the Cloudflare bot check, the Google map and the board sign-in service, or do we need a cookie notice?
6. **Consent records.** Families who registered under consent version v1 (before this policy existed): do they need to re-confirm under v2?
7. **Breach notification.** What would Texas law require us to do, and by when, if this information were exposed?
8. **Bilingual policies.** Should the English and Spanish versions both be legally binding, and what happens if they differ?

## Added 2026-11-23: family sign-in, verification, invitation logging

Context: `docs/overhaul/PHASE0_DRAFTS.md` has the draft wording these questions refer to. Items 9 to 19 are new.

9. **Verification result and chapter 181.** Question 1 asks whether collecting self-reported diagnoses makes HOEP a "covered entity". Does keeping a *confirmed* diagnosis (a result reviewed from a provider's letter, with the date and reviewer) change the answer, even though we delete the letter?
10. **Conditioning benefits on verification.** HOEP will include only verified households in invitations to diagnosis-specific events (after a 60-day window), and will later require verification for assistance and scholarships. Is a notice in the policy enough, or does this need consent, an appeal route, or other safeguards? Is a 60-day window reasonable?
11. **Handling the letter.** The letter is read by the President or Vice President and deleted when they decide; only the result is kept (no expiry). Does anything require us to keep the letter, or to delete the result sooner? What must the deletion cover (backups, the Cloudflare R2 copy, logs)?
12. **Children.** A parent or guardian may upload a letter about a child. Is the guardian attestation plus the `verification` consent enough, or is more needed for a minor's health information?
13. **Sign-in notice.** Is the "you are signed in to your family page" notice enough, or should signing in record a consent? Does an emailed one-time link count as sufficient proof of identity for a family to see and change its own household information?
14. **Terms of use.** Wording for the "Your family page" clause (sign-in links are personal; HOEP may suspend access for misuse).
15. **Sign-in emails.** Is a one-time sign-in link a transactional message the person requested (sent even if they withdrew contact consent), or a message that needs consent? We plan to treat it as transactional.
16. **Social sign-in.** If families may sign in with Google, Facebook or Apple through Auth0, is naming those providers in the provider table enough, or is a cookie or tracking notice needed? Builds on question 5.
17. **Text messages (later phase).** Before we send sign-in codes by text through Twilio Verify: what consent wording is required (TCPA), how must STOP and help replies be handled, and must Twilio be listed as a provider in the policy?
18. **Invitation logging.** We will log every automatic match and every manual removal (with a required reason code) in the access log, using ids only, and show a per-event report to the President and Vice President. Are there concerns about keeping this for 3 years, about removal reasons, or about excluding a household from an invitation by hand?
19. **Existing households.** The policy says that if a change affects how we use information already given, we will ask for consent again. Do verification and family sign-in count? Households registered under consent v2 (policy written before these features): what must we send them, and when can the 60-day window start for them?
