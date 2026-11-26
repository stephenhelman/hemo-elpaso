# Sanity setup (Phase 5A)

Project **`ed5kyl4v`**, dataset **`production`**. Studio lives inside the app at **`/admin/studio`**.

## 1. Do this once, in this order

### 1.1 Make the dataset private (required, do this BEFORE seeding)

When I checked (2026-11-14) the dataset answered queries with **no token**, i.e. it is currently **public** (and empty). Make it private first:

1. Go to <https://www.sanity.io/manage> → project **ed5kyl4v** → **Datasets**.
2. Next to `production` open the menu → **Edit dataset** → set **Visibility: Private** → save.
   - Or from a terminal with the Sanity CLI logged in: `npx sanity dataset visibility set production private`.
3. Verify (should now fail with 401): `curl "https://ed5kyl4v.api.sanity.io/v2025-01-01/data/query/production?query=*%5B0%5D"`

### 1.2 Create the read token (Viewer)

1. **API** → **Tokens** → **Add API token**.
2. Name: `hoep-web-read`. Permissions: **Viewer**.
3. Copy it once (it is not shown again). Put it in the hosting environment as `SANITY_API_READ_TOKEN` (Production and Preview). **Never** prefix it `NEXT_PUBLIC_`; it must stay server-only. (The client file imports `server-only`, so a client component cannot import it.)

### 1.2b Allow the site in Sanity CORS

The embedded Studio talks to Sanity from the browser. In <https://www.sanity.io/manage> → project → **API** → **CORS origins**, add every origin that opens `/admin/studio` (your production domain, any preview domain, and `http://localhost:3000` for development) **with "Allow credentials" ticked**. Without it the Studio shows "Before you continue… add the following URL as a CORS origin".

### 1.3 Environment variables

| Variable | Where | Value / notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | app (public ok) | `ed5kyl4v` (also the built-in default) |
| `NEXT_PUBLIC_SANITY_DATASET` | app (public ok) | `production` (also the default) |
| `SANITY_API_READ_TOKEN` | app, **server only** | Viewer token from 1.2. Required because the dataset is private. Without it the site shows the built-in dictionary copy and logs `[sanity] fetch failed`. |
| `SANITY_REVALIDATE_SECRET` | app, server only | Any long random string (`openssl rand -base64 32`). Must equal the webhook secret in 1.4. |
| `SANITY_WRITE_TOKEN` | **only in your shell when running the seed** | Editor-level token. Create it for the seed, delete it afterwards. Never add it to the app's environment. |

### 1.4 Webhook (so edits show up within seconds)

**API** → **Webhooks** → **Create webhook**:

| Field | Value |
| --- | --- |
| Name | `HOEP site revalidate` |
| URL | `https://<your-domain>/api/revalidate` |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["siteSettings","person","scholarship","sponsor","resource","conference","announcement","homePage","aboutPage","resourcesPage","getInvolvedPage","scholarshipsPage","contactPage"]` |
| Projection | `{_type, _id}` |
| HTTP method | `POST` |
| Drafts | leave **off** (only published changes matter) |
| Secret | the same value as `SANITY_REVALIDATE_SECRET` |

What each document type refreshes (`src/app/api/revalidate/route.ts`):

| Document type | Cache tag(s) invalidated | Affects |
| --- | --- | --- |
| `siteSettings` | `siteSettings` | footer-independent settings, 404/error pages, default share image, every page that reads settings |
| `scholarshipsPage` | `page:scholarships` | Scholarships page + its SEO |
| `scholarship` | `scholarship` | Scholarships page |
| `resource` | `resource` | Resources page (all five lists) |
| `conference` | `conference` | Resources page (Conference list) and automatic announcements |
| `announcement` | `announcement` | The announcement card on public pages |
| `sponsor` | `sponsor` | Sponsor strips, footer sponsors, event "Sponsored by" rows |
| `resourcesPage` | `page:resources` | Resources page + its SEO |
| `person` | `person` | any page with a People block (Scholarships contact card today) |
| `aboutPage` | `page:about` | About page + its SEO (it also reads `person`, so edits to people refresh it) |
| `getInvolvedPage` | `page:get-involved` | Get Involved page + its SEO |
| `contactPage` | `page:contact` | Contact page hero/headings + SEO. The sidebar reads Site settings, so a `siteSettings` change refreshes Contact too |
| `homePage` | `page:home` | Home page (hero, stats, events-feed heading, register band) + its title/description. Events themselves are not in Sanity |

Safety net: even if a webhook is missed, cached Sanity data expires after 1 hour.
A request with a wrong or missing signature gets **401**; with no secret configured the endpoint returns **500**.

### 1.5 Seed the content (once)

```
npm run seed:sanity                                   # dry run: lists the 8 documents
SANITY_WRITE_TOKEN=<editor token> npm run seed:sanity -- --write
```

It writes (published, fixed ids, 27 documents): Site settings, 5 people (Teresita as Officer / President·Presidenta, Lou Anne Fetters as Founder, Rosamaria Coles, Felix Garcia and Yolanda Ortiz as Past president), the memorial scholarship in **Coming soon**, the Scholarships page, **14 resources** (3 conditions, 3 national organizations, 3 local providers, 2 youth programs, 3 financial-help items; `lastVerified` = the day you run it) and the Resources page. No emails, no photos.

**Safe to re-run:** a document that already exists is **left alone** (edited text and uploaded photos are kept); only missing ones are created. `--overwrite` resets existing documents to the seed text on purpose. If you already created these people by hand in the Studio (with random ids), the seed will create a second copy under its own id: delete the duplicates in the Studio. Delete the write token when you are done.

`npm run check:sanity` is an offline test (no token, no network): it runs the real GROQ queries against the seed documents and checks that the seeded Scholarships and Resources pages equal today's dictionary copy, that inactive people and resources are hidden, that items are sorted by `order`, and that no email or editor-only field (`lastVerified`, `active`) appears in a result.

### 1.6 Upload the default share image (optional)

Studio → **Site settings** → SEO → *Share image* (1200 × 630). Until one is uploaded the site uses `src/app/opengraph-image.png`.

## 2. Who can edit (two layers)

| Layer | What it controls | How it is granted |
| --- | --- | --- |
| **1. The app** | Who can *open* `/admin/studio` (the "Site content" link, middleware and the page itself) | Permission `canEditSiteContent`. Held by board roles **President, Vice President, Secretary, Treasurer** and by admins. Assign roles in Admin → Settings → Board. |
| **2. Sanity** | Who can *save* in the Studio | A Sanity project membership. **Invite each officer** (below). Without it they can open the Studio but cannot sign in or save. |

### Inviting an officer

1. Make sure they have a board role in the admin (layer 1).
2. <https://www.sanity.io/manage> → project → **Members** → **Invite members** → their email → role **Editor** (not Administrator).
3. They accept the email, open **Site content** in the admin sidebar, and sign in to Sanity when asked.

### Removing an officer

Remove the board role in the admin (closes layer 1) **and** remove them under Sanity → Members (closes layer 2). Removing only one leaves the other open.

## 3. Content rules

> **Never add a person to Sanity until they're approved for public release. Inactive documents are hidden from the site, but they are still stored and visible to anyone with project access.**

- "Show on site" off = hidden from the website, **not deleted or private**. Delete the document if someone should no longer be on file.
- There is deliberately **no email field** on people, and the page queries only name, group, office, title, bio and photo.
- Contact cards show the organization phone and a link to the contact form, never a personal address.
- Spanish is optional per field: if it is empty the English text is shown (Studio shows a yellow warning).
- A scholarship set to **Open** needs a deadline, amount and essay prompt (Studio blocks publishing otherwise). The site switches an Open scholarship to **Closed** automatically the day after the deadline (El Paso time).
- Singleton documents (Site settings and the six pages) cannot be created, duplicated or deleted from the Studio.

## 4. Known limits (this phase)

- **Every public page renders from Sanity:** Home, About, Resources, Scholarships, Get Involved and Contact. Sponsorship tiers stay hidden and dormant in code; navigation and footer links stay in code.
- **Photos** are served through our own route, `/api/people-photo/<person id>`, which fetches them from the private dataset with the read token (see section 7). A person with no photo, or an inactive person, shows initials.
- The Studio is embedded in the admin shell; it fills the area to the right of the sidebar. I could not open it logged in from here (it needs an Auth0 board session and a Sanity login), so the embedded layout is **untested in a browser**.
- Fonts/CSS: Studio injects its own styles; if it ever looks cramped on a phone, use a desktop browser.

## 5. Fallback behaviour

If Sanity is unreachable, the token is missing/expired, or a document is not published, the site renders today's dictionary copy (identical pixels, checked at 375 px and 1200 px, EN and ES) and logs `[sanity] fetch failed, using dictionary fallback` to the server log. Site settings fall back field by field to the constants in `src/lib/site.ts`.

## 6. Resources (Phase 5B)

- **Studio:** *Resources* groups every item by category (Condition information, National organization, Local care, Youth program, Financial help). The subtitle shows the category, the last verified date and **⚠ STALE** when it is more than 12 months old (the date field also shows a yellow "Check this is still accurate." warning).
- **Adding a resource:** open the category, click **+**, fill in the name (English; add the Spanish name only if it differs), summary (EN, ES), link and the *Last verified* date. It appears on /resources automatically, sorted by *Order* (lower first). There is nothing to pick on the page itself: each list shows every *active* resource of its category.
- **Conditions are medical content:** the date is labelled *Last medically reviewed* with the note "Check wording against bleeding.org before editing."
- **Link label:** leave it empty to get "Learn more" / "Más información".
- **Phones** on local providers are the provider's own number (type the display form and the +1… form; tap-to-call uses the +1… form). The HOEP phone lives in Site settings.
- *Last verified* is for editors only; it is never sent to the website.
- Hiding: untick **Show on site**. As with people, the record is still stored and visible to project members.

## 7. About page and people photos (Phase 5C)

**Editing the About page** (Studio → Pages → About page): sections in order are *Page hero*, *Text with aside* (the founder story), two *Card grids* (Mission/Objective/Goal and What We Do; the second is set to "continues previous" so both sit in one band), *Featured person* (the founder spotlight), *People* (board) and *Call to action*.

**Number tokens** (work in every text field on every page, both languages; the Studio shows the list under each field):

| Type this | Shows today (EN / ES) | Notes |
| --- | --- | --- |
| `{years}` | 33 | years since the founding year (1993, set in code) |
| `{decadeYears}` | 30 | years rounded down to the decade ("Over 30 years") |
| `{decades}` | three / tres | the decade count as a word; capitalised at the start of a sentence ("Three Decades of Hope") |

They update by themselves every January. Unknown tokens such as `{foo}` are shown exactly as typed. (The brief asked for two tokens; `{decadeYears}` is a third because the live page says "over 30 years", not 33.)

**Past presidents list** (inside *Text with aside*): shows every *active* person whose group is **Past president or Founder**, in their Order (the founder is included because the live list starts with her). To add someone, create a person with that group; there is nothing to pick on the page.

**Photos.** Upload a photo on the person (with English alt text). It appears on the founder spotlight, the board cards and the contact card; people without one show initials.
How it works: the dataset is private, so a browser cannot load an image straight from `cdn.sanity.io`. `/api/people-photo/<id>` fetches the image with the server-only read token and serves it from our own domain (square crop that honours the **crop and hotspot** you set on the photo in the Studio, 128–640 px, cached). It only serves the photo of an **active person** and nothing else from Sanity. Replacing a photo changes its cache key automatically.
I could not test with a real photo from here (no token; anonymous queries return no documents, so I could not even find an asset URL). To check the raw-CDN question yourself: in the Studio open the photo → right-click the image → copy image address → paste it in a private window. If that shows the image, the dataset's assets are public; if it shows an authorization error (expected for a private dataset), the proxy is the right design.

**Seed note:** documents the seed wrote earlier are never touched (see section 1.5). If a page document seeded before Phase 5C shows "invalid item" warnings on button or badge rows in the Studio, that is because those rows lacked a `_type`; run `npm run seed:sanity -- --write --overwrite` **only if you have not edited that page**, or just re-add the row.

## 8. Get Involved and Contact (Phase 5D)

**Webhook: nothing to change.** The webhook filter in section 1.4 already lists `getInvolvedPage` and `contactPage`, and the revalidate route maps them to `page:get-involved` and `page:contact`. Edits to **Site settings** also refresh the Contact page.

**Get Involved** (Studio → Pages → Get Involved page): Page hero, a Card grid in the *Icon square with a link* variant (the four "Ways to Get Involved"; each card's link goes to `/contact` today) and a Call to action. The Sponsorship Tiers section is **not** part of the page: it stays hidden and dormant in code until the sponsors catalog exists.

**Contact** (Studio → Pages → Contact page): the layout is fixed in code (hero, then the message form next to the contact-details sidebar, then the map). You edit only: SEO, the hero, the form heading and text, and the map heading and text. The **sidebar** is edited in **Site settings**: phone (display + international format), Facebook link and label, location label and the small note. There are no office hours. The info email (`info@…`) comes from the environment, not the Studio. Form labels, reasons, error messages and the success message are interface text and stay in code; so does the map embed and its "Get Directions" link.

**Seed:** `npm run seed:sanity -- --write` now creates `getInvolvedPage` and `contactPage` if they are missing (26 documents in total).

**`--repair`:** `SANITY_WRITE_TOKEN=… npm run seed:sanity -- --repair --write` adds the missing `_type` markers to list rows (buttons, badges, cards, facts, tags) in documents that already exist, so the Studio stops flagging them as invalid. It changes nothing else (text, photos and edits stay) and only writes documents that need it; a second run changes nothing. (I had not built `--repair` before this phase: there was no such flag. The earlier notes only mentioned `--overwrite`, which resets a document and is not what you want after editing.)

## 9. Home page (Phase 5E)

**Webhook: nothing to change.** The filter in section 1.4 already contains `homePage`, and the revalidate route maps it to `page:home`. (Site settings changes refresh it too.)

**Editing** (Studio → Pages → Home page): sections in order are *Page hero* (variant *Full*), *Stats row*, *Upcoming events feed* and *Call to action* (the register band).

- **Hero:** eyebrow, heading, subheading, up to 2 buttons, up to 3 badges (each with an icon). To colour a word in the heading, select it and apply the **Accent** mark (today "Hope" / "Esperanza"). The footer tagline is a different field (Site settings → Tagline), so changing one does not change the other. The decorative circles and grid are part of the design and are not editable.
- **Stats row:** up to 4 stats. *Source* = "A number I type" (needs a value) or "Years of service" (computed from the founding year, 1993, so it never goes stale; the value field is hidden). Suffix is the "+" or "%" after the number. *Animate* makes it count up when scrolled into view.
- **Events feed:** you edit the heading, the subheading, how many events (1 to 6) and whether the "View All Events" button shows. The events themselves come from the events system (Admin → Events); "no events" and "spots left" wording is fixed in code.
- **Register band:** the blue call-to-action near the bottom. Keep **"Hide the whole banner unless online registration is open"** ticked: the band then stays hidden while registration is closed, exactly as before.
- **Title/description** in the page's SEO fields replace the site-wide ones for the home page only; the seed copies today's values, so nothing changes until you edit them.

**Seed:** `npm run seed:sanity -- --write` creates `homePage` if missing (27 documents in total). `--repair` also handles stat rows.

## 10. Conferences (feat/conferences)

Conferences are **external** events run by other organizations. HOEP shares them; the site takes no registrations and collects no travel requests.

**Webhook: change the filter** in section 1.4 so it includes `conference` (and `sponsor`, which the revalidate route already handled but the documented filter left out). Until then a conference edit takes up to an hour to appear.

**Add the block once** (after this version is deployed, so the Studio knows the type):

1. Admin > **Site content** > **Pages** > **Resources page**.
2. Under **Sections**, choose **Add item** > **Conference list**.
3. Fill in the header (eyebrow, heading, subheading in EN and ES), pick the background that alternates with its neighbours, and drag it to where it should appear.
4. **Publish**. Do not re-run the seed with `--overwrite`; it would reset the page.

**Add a conference:** Studio > **Conferences** > **+**. Required: name, web address name (press *Generate*; never change it after publishing), organizer, summary, first and last day, website and *Last verified*. Publish. It appears at `/resources#conference-<web address name>`.

- The list shows active conferences whose last day has not passed (El Paso time), soonest first. With none to show, the whole block is hidden.
- Registration times are entered in El Paso time. After registration closes the card says so and hides the registration button.
- **Travel assistance:** when switched on the card shows "HOEP travel assistance available" with the note, last day and link. It is hidden the day after the last day to ask. The link should point to an existing page (usually `/contact`) or an https address.
- The Studio warns when *Last verified* is more than 60 days old, and when registration has closed while the conference is still shown.

## 11. Site announcements (feat/site-announcements)

A small card in the corner of public pages that cycles through the live announcements. Visitors can close each one; that choice is kept on their device only.

**Webhook:** the filter in section 1.4 must include `announcement`.

**Turn it on** (it ships off): set `LEGAL_EFFECTIVE_DATE` in `src/content/legal/meta.ts` on deploy day, deploy, then Admin > **Settings** > **Feature toggles** > **Site announcements**. Switching it off hides the card from the next page load.

**Write one:** Studio > **Announcements** > **+**: title (EN, ES), optional short text and link label, what it links to, *Show from* and *Show until* (El Paso time), then publish. **Nothing about any individual family or person's health.**

| Links to | Shows only while |
| --- | --- |
| Page on this site | always within its dates (*Register for Information* also needs registration open) |
| HOEP event | the event is published, accepts requests from uninvited households, and is not over. By-invitation events never show |
| Conference | the conference is shown, has not ended, and the Conference list is on the Resources page. The card names the organizer |
| External website | the address starts with https:// |

**Automatic conference announcements:** tick *Announce when registration opens* on a conference. It shows from the opening time until registration closes (or until the first conference day when there is no closing time). Nothing appears in the Announcements list. To use your own wording, write an announcement that links to the same conference: while yours is live it replaces the automatic one. Before it starts and after it ends, the automatic one shows again (a visitor who closed only yours will then see it).

**Where the card never appears:** admin, the family page, RSVP and confirmation links, unsubscribe, Register for Information, access-denied and no-household pages. It also skips an announcement on the page it links to (a conference announcement is skipped on all of /resources).

The Studio's event check uses the site you are editing on, while the content dataset is shared. In a local or preview Studio an event that exists only in production shows a warning.
