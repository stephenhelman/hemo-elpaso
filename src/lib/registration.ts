/**
 * Launch switch for PUBLIC sign-ups (Register for Information + public RSVP).
 * REGISTRATION_OPEN=true opens them; anything else (including unset) keeps them
 * closed. Server-side only: API routes check it and answer 404 when closed, and
 * server components hand the value to client components (SiteFlagsContext).
 * Invitation links (/rsvp/[token]) and the admin are NOT affected.
 */
export function registrationOpen(): boolean {
  return process.env.REGISTRATION_OPEN === "true";
}
