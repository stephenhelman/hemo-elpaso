# Upgrading from Next.js 14.2.35 to 16: audit and plan

Audit date 2026-11-28. Read-only: no application code was changed. Based on the code on `main` (with `fix/r2-dev-guard`),
npm metadata, a lockfile-only dependency resolution in a throwaway folder, and the official guides listed at the end.
**Nothing here has been built or run on Next 15 or 16.** Items marked *not verified* need a test.

## Recommendation

Go to 16, in five shippable steps, using 15.5.29 as a stepping stone. 15.5 closes today's advisories before the two
large rewrites (sign-in and Sanity), and it needs neither of them. It must not be where you stop: its security releases
end **January 31, 2027**.

| Step | What ships | Risk | Why this order |
| --- | --- | --- | --- |
| 0 | Prerequisites | Low | Without them later steps can't be tested |
| 1 | `sharp` 0.35.5, Node 22 pinned | Low | Closes the library bugs behind the two critical image advisories now |
| 2 | Next 15.5.29, React 19, async request APIs | Medium | Closes the Next advisories. Sign-in library and Sanity stay as they are |
| 3 | Sign-in: `@auth0/nextjs-auth0` 4 (on 15.5) | **High** | Required for 16. On its own so a sign-in fault is easy to find and revert |
| 4 | Sanity: `next-sanity` 11, `sanity` 5 | Medium | Required for 16 |
| 5 | Next 16.4.6 | Medium | Mostly configuration once 2 to 4 are done |
| 6 | Later: `proxy.ts`, ESLint 9, `next-sanity` 13 and `sanity` 6 | Low to medium | Not needed to be on a supported, patched version |

To skip the stepping stone, steps 2, 4 and 5 become one change (step 3 can still go first, on 14). It saves one test
cycle and leaves a much larger change to debug.

Suggested timing: finish step 5 by mid-December 2026 if possible, and no later than early January 2027, to leave room
before the 15.5 end date.

## Versions

| Package | Now | Target | Needed because |
| --- | --- | --- | --- |
| next | 14.2.35 (unsupported) | 16.4.6 | |
| react, react-dom | 18.3.1 | 19.3.1 | Minimum for 15 and later |
| @types/react, @types/react-dom | 18 | 19 | |
| @auth0/nextjs-auth0 | 3.8.0 | 4.33.0 | 3.8.0 accepts Next up to `^15.2.3`; v3 gets no Next 16 support |
| next-sanity | 9.12.3 | 11.6.13, later 13.5.1 | 9 stops at Next 15; 13 needs React 19.2.3 and Next 16 |
| sanity | 3.99.0 | 5.x, later 6.25.0 | next-sanity 11 needs 4.22 or 5 |
| @sanity/image-url | 1.2.0 | 1.x for now; 2.x with sanity 6 | |
| sharp | 0.34.5 | 0.35.5 | Security; Next 16.4.6 asks for `^0.35.5` |
| eslint, eslint-config-next | 8, 14 | 9, 16 | `eslint-config-next` 16 needs ESLint 9 |
| Node | not pinned | 22.12 or later | Next 16 needs 20.9; sanity 5 needs 20.19; sanity 6 needs 22.12 |

Dry run of the full target set (including `next-sanity` 13 and `sanity` 6): npm resolves it with no invalid peers left;
about 700 packages change version; `npm audit` on the result shows **no critical advisories and none for Next, sharp,
form-data or axios** (13 high remain in other packages, such as `prisma`, `deepl-node` and `@faker-js/faker`).
React 19 is accepted by the other UI libraries at their installed versions (framer-motion, Radix, FullCalendar, lucide,
react-hot-toast, react-hook-form, react-email, Vercel Analytics, Portable Text 3).

## What the code uses (measured)

| Area | In this repo |
| --- | --- |
| `params` | About 50 API route handlers and 20 pages. 11 pages use `searchParams`. 14 files have `generateMetadata`. No client page or layout takes them |
| `cookies()` | 2 calls, both already awaited (`lib/locale.ts`) |
| `headers()` | 2 synchronous calls (event photos page, event stats page) |
| `draftMode`, `request.ip` / `geo`, runtime config, AMP, parallel routes, `useFormState` | none |
| Caching | `unstable_cache` in 3 files; `revalidateTag` 4 calls; `revalidatePath` 3; Sanity fetches set `next: { tags, revalidate }` explicitly |
| Static output | Only `/manifest.webmanifest` is prerendered in the current build; everything else renders per request |
| Middleware | `src/middleware.ts` (Edge), a short matcher list; calls `/api/session/access` |
| `next.config.mjs` | `experimental.instrumentationHook`, `eslint`, `typescript`, `redirects()`. No webpack or image settings |
| `next/image` | Imported in one file; no `<Image>` element found |
| Server Actions | One (`setLocaleCookie`), plus whatever Studio registers |

## Step 0: prerequisites (low)

- Merge `fix/r2-dev-guard` and create `hoep-media-dev` (`docs/STORAGE.md`), so the photo and flyer checks run.
- Record a green baseline: `npx tsc --noEmit`, `npm run build`, `npm run check:all` with nothing skipped.
- Vercel → Settings → General → Node.js Version: note it, plan for 22.x. *Not visible from the repo.*
- In Vercel Analytics, look at iOS and Android versions. Next 16 supports **Chrome, Edge and Firefox 111+ and Safari
  16.4+**. Phones stuck below iOS 16.4 (iPhone 7 and older) may break. *The share among your families is not known.*
  Decide before step 5.

## Step 1: sharp 0.35.5 and Node (low)

- `package.json`: `sharp` `^0.35.5`, add `"engines": { "node": "22.x" }`.
- Breaking changes in 0.35.0 that were checked against the code: `failOnError` removed (the code uses `failOn`);
  `paletteBitDepth` and `jp2k` renamed or removed (unused); new `limitInputChannels` default of 5 (photos have 3 or 4);
  no install script, prebuilt binaries only (Vercel Linux has one). AVIF tuning changed (the site writes WebP).
- Risk: image processing differs slightly. Next 14 also uses this `sharp` for its image service.
- Verify: `check:photo-pipeline` on the dev bucket; upload a rotated phone photo; flyer upload; brand scripts if used.
- Rollback: revert the branch.
- Whether Vercel's own image service was ever exposed to the image advisories is *not verified*; upgrading Next
  (step 2) is what Next's advisories name as the fix for the AVIF one.

## Step 2: Next 15.5.29 and React 19 (medium)

- Bump `next`, `eslint-config-next` (15.5), `react`, `react-dom`, types. Run
  `npx @next/codemod@canary next-async-request-api .` and review every change.
- **Async APIs:** `params`, `searchParams`, `cookies()`, `headers()` become promises. 15 still allows the old way with
  warnings; fix all of them now, because 16 removes it. Put `await params` **after** the permission check in route
  handlers: several checks require the check within the first 200 to 220 characters of a handler, and it is the better
  order anyway.
- **Caching defaults:** `fetch` and `GET` route handlers are no longer cached by default, and the browser no longer
  reuses page segments on navigation. Little should change here (pages already render per request; Sanity fetches set
  their caching). Expect somewhat more requests while browsing. Compare the build's static/dynamic table before and after.
- **Config:** remove `experimental.instrumentationHook` (instrumentation is stable from 15; the upgrade guides don't
  mention the flag) and update `check:email-guard`, which requires it.
- **React 19:** none of the removed APIs are used. `forwardRef` (35 uses) still works. `useRef<T>(null)` (29 uses) now
  types as `T | null`; the type check will list any that need changing.
- Sign-in: `@auth0/nextjs-auth0` 3.8.0 supports 15.2.3+. Test the custom `login` handler in
  `app/api/auth/[auth0]/route.ts`, which receives `ctx.params`.
- Sanity: `next-sanity` 9 and `sanity` 3 accept Next 15 and React 19. Open the Studio and publish a test change.
- Verify: all checks; sign in as board and as family on a preview; language switch; RSVP link; check-in scanner; Studio.
- Rollback: Vercel → promote the previous deployment (no database change in any step).

## Step 3: Auth0 SDK 4 (high)

A rewrite of the library, on the one thing that locks the board and families out if wrong.

| Change in v4 | What to do here |
| --- | --- |
| `initAuth0` and `@auth0/nextjs-auth0/edge` are gone; one `Auth0Client` | Replace `lib/auth0.ts` and the middleware instance |
| Routes are served by middleware at `/auth/*`; the `[auth0]` route file goes | Keep today's addresses with the `routes` option (`/api/auth/login`, `/logout`, `/callback`, profile `/api/auth/me` with `NEXT_PUBLIC_PROFILE_ROUTE`), so the Auth0 dashboard and links don't change |
| Middleware must run on those routes | Add `/api/auth/:path*` to the matcher. Don't adopt the recommended catch-all: `check:twilio-guard` forbids it, and the phone webhooks must stay outside |
| Env names `AUTH0_DOMAIN`, `APP_BASE_URL` | Pass `domain` and `appBaseUrl` in code from the existing variables; no Vercel change |
| Session defaults: **3 days** absolute, 1 day idle; `rollingDuration` is now `inactivityDuration` | Set 7 days and 24 hours explicitly. The Privacy Policy states them; `check:identities` compares |
| The middleware is what extends a session | Today an API route reading the session can extend it too. Make the matcher cover every signed-in page and API, then test idle sign-out. *Not verified:* whether other reads extend it in v4 |
| **All** query parameters on the login address are forwarded to Auth0 | Today only `prompt=login` is allowed through. Strip the rest in the middleware |
| An access-token endpoint is on by default | `enableAccessTokenEndpoint: false` |
| `handleAuth({ onError })` is gone | Redirect to `/access-denied` from the `onCallback` hook; keep logging codes only |
| `UserProvider` → `Auth0Provider` | Two layouts; `useUser` keeps its name |
| Session keeps a fixed set of claims | `sub`, `email`, `email_verified`, `name`, `picture` are included: what sign-in matching uses |
| Cookie `__session` replaces `appSession` | v4 reads the old cookie, so people should stay signed in. Test with a session made before the deploy |

- Checks to rewrite: `check:admin-pages` builds its sign-in cookie from v3 internals (v4 offers
  `generateSessionCookie` in `@auth0/nextjs-auth0/testing`); `check:identities` (session settings); `check:nav` and
  `check:portal` only if addresses change.
- Manual tests: board sign-in; family sign-in with Google, Apple, Facebook and emailed code; denied account;
  "Sign in with a different account" (it calls Auth0's `/v2/logout` directly); sign-out; idle 24 hours; a preview deploy.
- Rollback: promote the previous deployment. People who signed in on v4 must sign in again.
- This step can also be done on 14.2.35 (v4 accepts it) if you prefer sign-in first.

## Step 4: Sanity (medium)

- `next-sanity` 11.6.13 and `sanity` 5. Sanity 5 needs React 19.2.2 and Node 20.19.
- The migration guides change preview, live and visual-editing imports, none of which are used. Nothing read mentions
  changes to `createClient`, `NextStudio`, `parseBody` or `sanity/structure`. Sanity 5's TypeGen naming change only
  matters with generated types.
- *Not verified:* upgrade notes for Studio 4 were not found, so test the Studio by hand: every schema, the custom
  structure, image hotspot, publishing, the webhook, and that private-dataset images still load.
- Verify: `check:sanity`, `check:conferences`, `check:announcements`; open each public content page in both languages.
- Rollback: promote the previous deployment. Check that content edited in the new Studio opens in the old one before
  relying on this.

## Step 5: Next 16.4.6 (medium)

| Change in 16 | Here |
| --- | --- |
| Synchronous request APIs removed | Done in step 2 |
| `revalidateTag` needs a second argument | Use `revalidateTag(tag, { expire: 0 })` in all 4 places (features, email routes, permissions, Sanity webhook). **Not `"max"`**: that serves the old value once more, which for permissions and feature switches is wrong |
| `unstable_cache` | Still documented and not deprecated; keep. Confirm in the build (the docs don't say how it behaves without Cache Components) |
| `middleware` deprecated in favour of `proxy` (Node runtime) | Keep `middleware.ts` for this step (the guide: keep it for Edge). No removal version is published |
| Turbopack builds by default | No webpack config, so it should build. Studio under Turbopack is *not verified*; fallback `next build --webpack` in `scripts/vercel-build.mjs` |
| `next lint` and the `eslint` config key removed | Delete the key; change the `lint` script (builds don't lint today) |
| Smooth scrolling is no longer overridden during navigation | `globals.css` sets `scroll-smooth`: add `data-scroll-behavior="smooth"` to `<html>` in both layouts |
| Image defaults, parallel-route `default.js`, runtime config, AMP | Not used |
| Node 20.9, TypeScript 5.1, newer browsers | Met (TypeScript 5.9); browsers: see step 0 |

- Verify: all checks; the same manual tests as steps 2 and 3; turn a feature toggle and a permission off and on and see
  the very next request change; publish in Studio and see the page update.
- Rollback: promote the previous deployment.

## Step 6: afterwards

- `proxy.ts`: rename file and function. It runs on Node, so it could read the database directly instead of calling
  `/api/session/access`; do that as its own change. Update `check:legal-links` and `check:twilio-guard`, which read
  `src/middleware.ts`.
- ESLint 9 with flat config.
- `next-sanity` 13 and `sanity` 6 (Node 22.12, React 19.2.3), `@sanity/image-url` 2 (check `sanity/photoUrl.ts`).
  *Not verified:* Studio 6 upgrade notes were not found.

## Vercel build

`vercel.json` runs `node scripts/vercel-build.mjs` (R2 check, `prisma migrate deploy`, `prisma generate`, legal check,
`next build`): no change needed through step 5 except the optional `--webpack` flag. Set the project's Node version to
22.x with step 1. No environment variable has to change. Preview deploys need the development bucket. Prisma stays on 6.
The cron jobs are unaffected. Next 16 no longer prints page sizes; nothing reads them.

## Check scripts (all 39)

"Run" means: no change expected, but it must pass after each step.

| Script | Expected change | Step |
| --- | --- | --- |
| `check:admin-pages` | Rewrite the forged sign-in cookie; builds and starts the real app, so it is the main safety net | 3; run at 2 and 5 |
| `check:identities` | New session setting names | 3 |
| `check:nav` | Only if sign-in addresses change | 3 |
| `check:portal` | Reads components for the login address: same condition | 3 |
| `check:email-guard` | Drop the `instrumentationHook` assertion | 2 |
| `check:legal-links` | Reads `src/middleware.ts` (matcher entries) | 3, 6 |
| `check:twilio-guard` | Reads `src/middleware.ts`; forbids a catch-all matcher | 3, 6 |
| `check:permissions`, `check:features`, `check:email-routing`, `check:phone-routing`, `check:phone-voicemail` | Require the permission check near the top of each handler: keep `await params` after it | 2, 5 |
| `check:household`, `check:rsvp`, `check:rsvp-requests` | Render components or call handlers with plain `params` objects. `await` accepts those; the type check may ask for promises | 2 |
| `check:merge`, `check:review`, `check:twilio-webhook` | Call route handlers directly with `NextRequest` | run at 2, 5 |
| `check:address`, `check:flyers`, `check:portal-edits` | Render with React's server renderer (React 19) | run at 2 |
| `check:sanity`, `check:conferences`, `check:announcements` | Sanity queries and display rules | run at 4 |
| `check:photo-pipeline`, `check:flyer-upload` | Need the dev bucket; test `sharp` and uploads | run at 1 |
| `check:r2-config` | Reads source for storage rules | run |
| `check:host-redirects`, `check:legacy-redirects` | Redirect rules from `next.config.mjs` | run at 2, 5 |
| `check:timezone`, `check:retention`, `check:invitation-guard`, `check:invitation-log`, `check:withdrawal`, `check:event-save`, `check:phone-prereqs`, `check:phone-prompts`, `check:legal`, `check:legal-placeholders` | Plain logic and database | run |

Scripts that call library code outside Next rely on cached reads failing safely; confirm that still holds on 15 and 16
(*not verified*).

## Open questions for you

1. Take the 15.5 stepping stone, or go from 14 to 16 in one larger change?
2. What share of families use phones older than iOS 16.4, and is dropping them acceptable?
3. Sign-in first (on 14) or after Next 15 (as above)?

## Sources

- <https://nextjs.org/docs/app/guides/upgrading/version-15>
- <https://nextjs.org/docs/app/guides/upgrading/version-16>
- <https://nextjs.org/docs/app/api-reference/functions/revalidateTag>
- <https://nextjs.org/docs/app/api-reference/functions/unstable_cache>
- <https://nextjs.org/docs/app/api-reference/file-conventions/proxy>
- <https://nextjs.org/support-policy> and <https://nextjs.org/blog/november-2026-security-release>
- <https://github.com/auth0/nextjs-auth0/blob/main/V4_MIGRATION_GUIDE.md> and the 4.33.0 package's type definitions
- <https://github.com/sanity-io/next-sanity/tree/main/packages/next-sanity> (MIGRATE-v9-to-v10 to v12-to-v13)
- <https://sharp.pixelplumbing.com/changelog/v0.35.0> and `/v0.35.5`
- <https://github.com/advisories/GHSA-2464-fhr4-w9xw>, `GHSA-2xp9-vwfh-vxw4`, `GHSA-p3m5-59mp-jv5r`
