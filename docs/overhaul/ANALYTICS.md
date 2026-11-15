# Analytics (Vercel Web Analytics)

Page-view counts for the **public** site only, with everything that could identify a person removed in the browser before it is sent.

## What is collected

- **Page views** of public pages (`/`, `/about`, `/events`, `/events/<slug>`, `/resources`, `/scholarships`, `/get-involved`, `/contact`, `/register-info`, `/rsvp/[token]`, `/unsubscribe`). Vercel adds its standard anonymous context (country, device, browser, OS, referrer). Per Vercel's documentation it uses no cookies and no cross-site tracking; please re-read their current privacy page before you tell members that, since that is their statement, not ours.
- **Custom events (off by default, see below):** exactly three, with fixed names and properties:

| Event | Property | Fired when |
| --- | --- | --- |
| `register_info_submitted` | none | the "Register for Information" form is accepted |
| `rsvp_submitted` | `source` = `invite` or `public` | an invitation link is answered "yes" for the first time (`invite`), or the public RSVP form on an event page is accepted (`public`) |
| `language_switched` | `to` = `en` or `es` | a visitor clicks the EN/ES switch on a public page |

No other properties, ever: no event name, no event id, no names, emails, party sizes, diagnoses or anything typed into a form. The allow-list is the `AnalyticsEvent` type in `src/lib/analytics.ts`; nothing else can be sent without changing that file.

## What is redacted (and where)

Every page view and event passes through `sanitizeAnalyticsEvent` (`src/lib/analytics.ts`, wired as `beforeSend` in `src/components/analytics/SiteAnalytics.tsx`) **in the browser, before it leaves**.

| Input | Reported as |
| --- | --- |
| `/admin/*` (including `/admin/studio`) and `/api/*` | **dropped** (nothing is sent) |
| `/rsvp/<token>` (with or without `?lang=`) | `/rsvp/[token]` (keeps `?lang=en\|es` only) |
| `/unsubscribe…` (any query string) | `/unsubscribe` (no query at all) |
| any other URL | path only, plus `?lang=en\|es` if present; every other query parameter and the `#hash` are dropped |
| anything still containing `@`, `%40` or the word `token` | **dropped** |

Also: the Analytics component is mounted only in the public layout. The admin layout (a separate root layout) does not load the script at all, so `/admin/*` pages never even start it; the rule above is a second layer. `/rsvp/<token>` pages already send `Referrer-Policy: no-referrer`, so the token cannot leak through a referrer to the next page either.

## How I checked it (2026-11-14)

- **Unit cases** for the URL rules (16 inputs: tokens, emails in query strings and in paths, admin, api, unsubscribe, `lang`, hash, invalid URL): all pass.
- **Real browser, real analytics script (development build):** Vercel's debug script runs your `beforeSend` and logs `{before, after}` without sending anything in development. Results:
  - `/rsvp/AbCdEf0123456789tok?lang=es` → `/rsvp/[token]?lang=es`
  - `/unsubscribe?token=x` → `/unsubscribe`
  - `/events?lang=en&q=maria` → `/events?lang=en`
- **`/admin/studio`:** the admin layout does not include the analytics component, the script loader exists only in the public layout's JavaScript, and the sanitizer drops the URL anyway. I could not open `/admin/studio` in a browser here (it needs a board login), so that part is verified by code and build output, not by watching the page.
- **Not verified:** the *production* script's behaviour (it only exists on Vercel; the same `beforeSend` contract applies). After the first deploy, open the Network tab on `/unsubscribe?token=x` and confirm the request to `/_vercel/insights/view` carries `dl=…/unsubscribe` with no query.

## Custom events and your plan

Vercel documents custom events as **available on Pro and Enterprise plans only** (<https://vercel.com/docs/analytics/custom-events>). I cannot see which plan you are on, so they ship **disabled**: the code calls them only when the build has `NEXT_PUBLIC_ANALYTICS_CUSTOM_EVENTS=true`. On Hobby, leave it unset: page views work, events are simply not sent. If you are on Pro: add that variable in Vercel (Production and Preview) and redeploy.

## How to turn it on in the Vercel dashboard

1. Vercel → your project → **Analytics** tab → **Enable** (Web Analytics).
2. Redeploy (or push). The script is served from `/_vercel/insights/…` on your own domain.
3. Visit a few public pages; data appears in the Analytics tab within a minute or two.
4. (Pro only) add `NEXT_PUBLIC_ANALYTICS_CUSTOM_EVENTS=true`, redeploy, and the three events show up in the **Events** panel.

To switch analytics off: remove `<SiteAnalytics />` from `src/app/(public)/layout.tsx`, or disable Web Analytics in the dashboard.
