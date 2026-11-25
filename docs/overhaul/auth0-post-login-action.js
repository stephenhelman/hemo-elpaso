/**
 * Auth0 Post-Login Action: verified email only
 * ---------------------------------------------
 * Replaces the old "Board-only login gate" (docs/overhaul/auth0-board-action.js, BOARD_ALLOWLIST). There is NO
 * allow-list any more. Auth0 only signs people in; the HOEP database decides who they are and what they can reach
 * (see docs/overhaul/AUTH0_PRODUCTION.md).
 *
 * The only rule: deny a sign-in whose email is missing or unverified. The site links accounts to households and board
 * records by VERIFIED email, so an unverified one must never get through.
 *
 * Passwordless email (connection "email", one-time code): receiving the code proves the address, so it passes even if the
 * token's email_verified is not set. The site applies the same rule (lib/identity/rules.ts emailVerifiedFor). A code
 * sign-in only ever gives FAMILY mode: board mode needs a google-oauth2 identity on the org domain.
 *
 * Known cases:
 *  - A Facebook account with no verified email is denied (the site shows "We need a verified email").
 *  - Apple "Hide my email" signs in fine but its relay address matches no household. The person lands on
 *    "We couldn't find your household" and the President or Vice President links it by hand (Admin > Sign-ins).
 *
 * SETUP: Auth0 Dashboard > Actions > Library > Build Custom. Name "Verified email only", trigger Login / Post Login,
 * Node 18+. Paste, Deploy, then Actions > Flows > Login: drag it between Start and Complete, Apply. Test first with
 * the editor's Test button (email_verified true and false), and keep a private window signed in so you can't lock
 * yourself out. No secrets are needed.
 */
exports.onExecutePostLogin = async (event, api) => {
  const emailCode = event.connection && event.connection.strategy === "email";
  if (!event.user.email || (event.user.email_verified !== true && !emailCode)) {
    // The reason is a fixed code: no email address, name or other personal detail.
    api.access.deny("email_not_verified");
  }
};
