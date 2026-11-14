/**
 * Auth0 Post-Login Action: board-only login gate
 * ------------------------------------------------
 * DRAFT — NOT APPLIED. Install manually in the Auth0 dashboard.
 *
 * Denies login to any email not on the board allow-list. Patients are
 * accountless in the lean app, so only board members should ever authenticate.
 *
 * SETUP
 * 1. Auth0 Dashboard → Actions → Library → Build Custom
 *    Name: "Board-only login gate"   Trigger: Login / Post Login   Runtime: Node 18+
 * 2. Paste this file's contents into the editor.
 * 3. Left sidebar → Secrets → add:
 *      BOARD_ALLOWLIST = comma-separated, lowercase emails, no spaces
 *                        e.g. "president@example.org,treasurer@example.org"
 *    (Secret, not a hard-coded list, so changing the roster needs no redeploy
 *    of code — edit the secret, then Deploy.)
 * 4. Deploy. Then Actions → Flows → Login → drag the Action between Start and
 *    Complete → Apply.
 * 5. TEST BEFORE APPLYING: use the "Test" (play) button in the editor with an
 *    allowed and a non-allowed email. Then log in from a private window with
 *    your own board account before logging out of your current session, so you
 *    can't lock yourself out. Keep your own email in the allow-list.
 *
 * NOTES
 * - Existing sessions are not terminated; the gate applies on next login.
 * - This only controls who can authenticate. The app still checks
 *   Patient.role in ("board","admin") in middleware.ts and requirePermission().
 *   Keep BOARD_ALLOWLIST and the board roster in the app in sync.
 * - Require verified email so an attacker can't sign up with a board address
 *   on a database connection without owning it (check below).
 * - With social/passwordless connections, event.user.email is provider-asserted;
 *   consider disabling sign-ups on the connection (Authentication → Database
 *   → Disable Sign Ups) so board users are created by invitation only.
 */
exports.onExecutePostLogin = async (event, api) => {
  const allow = (event.secrets.BOARD_ALLOWLIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email = (event.user.email || "").trim().toLowerCase();

  if (!email || !event.user.email_verified || !allow.includes(email)) {
    api.access.deny(
      "access_denied",
      "This sign-in is restricted to HOEP board members.",
    );
  }
};
