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
| Filter | `_type in ["siteSettings","person","scholarship","resource","homePage","aboutPage","resourcesPage","getInvolvedPage","scholarshipsPage","contactPage"]` |
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
| `resourcesPage` | `page:resources` | Resources page + its SEO |
| `person` | `person` | any page with a People block (Scholarships contact card today) |
| `aboutPage` | `page:about` | About page + its SEO (it also reads `person`, so edits to people refresh it) |
| `homePage`, `getInvolvedPage`, `contactPage` | `page:home`, … | nothing yet (those pages still render from code) |

Safety net: even if a webhook is missed, cached Sanity data expires after 1 hour.
A request with a wrong or missing signature gets **401**; with no secret configured the endpoint returns **500**.

### 1.5 Seed the content (once)

```
npm run seed:sanity                                   # dry run: lists the 8 documents
SANITY_WRITE_TOKEN=<editor token> npm run seed:sanity -- --write
```

It writes (published, fixed ids, 24 documents): Site settings, 5 people (Teresita as Officer / President·Presidenta, Lou Anne Fetters as Founder, Rosamaria Coles, Felix Garcia and Yolanda Ortiz as Past president), the memorial scholarship in **Coming soon**, the Scholarships page, **14 resources** (3 conditions, 3 national organizations, 3 local providers, 2 youth programs, 3 financial-help items; `lastVerified` = the day you run it) and the Resources page. No emails, no photos.

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

- **Scholarships, Resources and About render from Sanity.** Home, Get Involved and Contact documents exist in the Studio but changing them does nothing yet.
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
