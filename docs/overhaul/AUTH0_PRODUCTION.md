# Auth0 in production: connections, Action, deploy order

Auth0 only signs people in. It has **no allow-list**. The database decides who they are and what they can reach
(`src/lib/identity/*`). One Auth0 application serves families and board members; both use Google, Apple or Facebook.

- Board mode = a **Google Workspace** account on `@hemoelpaso.org` (`emailDomain()`) belonging to someone with the admin role or an active board role.
- Any other sign-in (personal Gmail, Apple, Facebook, or an org address on Apple/Facebook) is a **family** session: their own household page only, never `/admin`.

## 1. Why dev keys are not enough

Auth0 pre-fills Google and Facebook with **Auth0 development keys** so you can try them. They are shared, rate-limited, show Auth0's name on the consent screen, and **must not be used in production**: they do not return what a real app gets, and Auth0 flags them in the dashboard ("This connection is using Auth0 development keys"). Apple has no dev keys at all. Create your own client for each provider and paste them into Auth0 under **Authentication > Social**.

Every connection below must be **enabled for the application** (connection > Applications tab) and the dashboard must show no "development keys" warning. Do **not** enable the Database connection for this application, or turn off its sign-ups (**Authentication > Database > Disable Sign Ups**), and do not enable passwordless.

Callback URL for all three providers (Auth0's, not the site's): `https://<AUTH0 CUSTOM DOMAIN OR TENANT>.auth0.com/login/callback`. Use a custom domain (`login.hemoelpaso.org`) if you have one; the providers show that name to families.

## 2. Google (own OAuth client)

Two audiences use Google: families (any Gmail) and the board (Workspace). One client serves both.

1. Google Cloud Console > create a project (e.g. "HOEP sign-in") under the HOEP organization.
2. **OAuth consent screen**: User type **External** (families have Gmail), app name "Hemophilia Outreach of El Paso", support email `info@hemoelpaso.org`, logo, authorized domain `hemoelpaso.org`, links to `/privacy` and `/terms`. Scopes: only `openid`, `email`, `profile`.
3. **Publish the app** (Publishing status: *In production*). Left in *Testing*, only listed test users can sign in and tokens expire after 7 days. Basic scopes need no Google verification review.
4. **Credentials > Create OAuth client ID > Web application**. Authorized redirect URI: the Auth0 callback above.
5. Auth0 > Authentication > Social > Google: paste Client ID and secret, scopes **email, profile** only, enable for the HOEP application. Turn **off** "Sync user profile attributes" extras and any Contacts/Gmail scopes.
6. Workspace: confirm the board accounts exist (`president@`, `vicepresident@`, `secretary@`, `treasurer@`, `admin@hemoelpaso.org`). Board mode requires `provider = google-oauth2` and the verified org address. Google always asserts `email_verified`.

## 3. Apple (Apple Developer account)

1. Apple Developer Program membership (organization, nonprofit fee waiver available) > **Certificates, Identifiers & Profiles**.
2. **Identifiers > App IDs**: create one with *Sign in with Apple* enabled. **Identifiers > Services IDs**: create one (this is the Auth0 *Client ID*), enable *Sign in with Apple* > Configure: Domains = the Auth0 domain, Return URL = the Auth0 callback.
3. **Keys**: create a key with *Sign in with Apple*, download the `.p8` once, note the Key ID and your Team ID.
4. Auth0 > Social > Apple: Services ID, Team ID, Key ID, the `.p8` contents. Scopes: **name, email**. Enable for the application.
5. **"Hide My Email"**: Apple may give a relay address (`...@privaterelay.appleid.com`). It matches no household, so the person lands on "We couldn't find your household" and the President or Vice President links it by hand (**Admin > Sign-ins**). Apple only sends name and email on a person's *first* authorization.
6. If a family registered with a relay address and we email it, register the sending domain/address in Apple's **Private Email Relay** (Certificates, Identifiers > More > Configure) so mail from `noreply@`/`info@`/`events@hemoelpaso.org` is delivered. Receiving nothing from us is the symptom.

## 4. Facebook (Meta app)

1. developers.facebook.com > create an app (type *Consumer*/Authenticate and request data), attached to HOEP's Meta Business account.
2. Add the **Facebook Login** product. Valid OAuth Redirect URI: the Auth0 callback. App domain `hemoelpaso.org`; Privacy Policy URL `https://hemoelpaso.org/privacy`; Terms URL `/terms`; **User data deletion** instructions URL `https://hemoelpaso.org/privacy` (or `/contact`); app icon and category.
3. Permissions: `public_profile` and `email` need no App Review. Business verification is only required for advanced access.
4. Switch the app from **Development to Live**. In Development, only app admins/testers can sign in.
5. Auth0 > Social > Facebook: App ID, App Secret, permissions **public_profile, email**. Enable for the application.
6. A Facebook account **without a verified email** (or with only a phone number) is denied by the Action; the site then says "We need a verified email" and offers another account. Test this with a real account before launch.

## 5. The Action (replaces the allow-list)

`docs/overhaul/auth0-post-login-action.js`: denies a sign-in whose email is missing or unverified. Nothing else. No secrets.

1. Actions > Library > Build Custom: name "Verified email only", trigger Login / Post Login, Node 18+. Paste, **Deploy**.
2. Actions > Flows > Login: drag it between Start and Complete, **Apply**. Remove the old "Board-only login gate" from the flow when you do (see step 4 below for timing).
3. Test with the editor's Test button: `email_verified` true passes; false and a missing email are denied.

## 6. Application settings (one Regular Web App)

- Allowed Callback URLs: `https://hemoelpaso.org/api/auth/callback` (keep the preview/dev URLs you use).
- Allowed Logout URLs: `https://hemoelpaso.org`, `https://hemoelpaso.org/api/auth/login?returnTo=%2Fportal&prompt=login`, `https://hemoelpaso.org/api/auth/login?returnTo=%2Fadmin&prompt=login` (the "Sign in with a different account" links).
- Allowed Web Origins: `https://hemoelpaso.org`.
- Connections enabled: Google, Apple, Facebook only.
- Env (Vercel): `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` (unchanged). Session lifetime is set in code (`src/lib/auth0-config.ts`: 7 days absolute, 24 hours idle), not by env, so the policy text and behavior cannot drift.
- Auth0's own SSO session (Tenant settings > Advanced > Session) is separate; leave it at or below the 7-day figure.

## 7. Production deploy order (feat/identities)

1. Merge `feat/identities`. The migration runs on deploy (additive; it copies every `patients.auth0Id` into `user_identities` as `backfill`). Check the counts match.
2. With the **old** allow-list Action still on: confirm each officer still signs in with the Gmail they use today (grandfathered while the setting is OFF) and that `admin@hemoelpaso.org` still reaches Settings only.
3. Configure Google, Apple, Facebook with your own keys (sections 2 to 4). Test each in a private window.
4. **Swap the Action** (section 5). Families can now authenticate; until the family page ships they see "coming soon" at `/portal`, and `/admin` sends them to their page. Test: sign in with a family Gmail, open `/admin`, expect to land on `/portal` (or "We couldn't find your household" if unmatched).
5. Admin > Settings > Board Management: for each officer, set the HOEP email on their record. Each officer signs in once with their `@hemoelpaso.org` Google account; it links itself.
6. Admin > Settings > **Board sign-in**: when all four officers show a green check, turn **"Board sign-in requires an @hemoelpaso.org account"** ON. The officers get an email.
7. Delete the `BOARD_ALLOWLIST` secret from the old Action (or delete the old Action).

**Rollback:** turn the setting OFF (immediate); re-apply the old Action from the tag text; `git revert -m 1` the merge. The new tables stay dormant.

## 8. Ongoing

- New officer: Admin creates their record (name + HOEP email + role). First Google Workspace sign-in links itself. There is nothing to edit in Auth0.
- Officer leaves: remove the role (board access ends on their next request) and suspend their Workspace account. Unlinking an org sign-in is only needed if you want to keep the person without board access.
- A family signs in with an address that isn't their registered one: **Admin > Sign-ins** shows it for 30 days; the President or Vice President links it to the right household (or merges duplicate records).
- "A sign-in needs review" emails (route `board.duplicates`, default president@ and vicepresident@) mean one email matched more than one household. They contain only a link.
