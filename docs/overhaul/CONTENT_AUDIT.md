# HOEP Public Site — Content Audit

Read-only audit for designing Sanity schemas and a block library.
Date: 2026-11-14. Branch: `main` (clean at start). Nothing in the repo was modified except this file.

**Conventions**

- Paths are relative to the repo root. `T:` means `src/translation/`, `C:` means `src/components/`, `A:` means `src/app/(public)/`, `M:` means `src/messages/`.
- `file:line` cites come from files I read. A bare file with no line is a whole-file reference.
- **[inferred]** marks anything I did not directly observe (for example reachability, or counts I estimated).
- Classes: **CONTENT** (editorial), **UI** (chrome, forms, toasts, empty states), **LEGAL** (consent, versioned), **CONFIG** (contact info, social, address, org name).
- "ES?" is `Y` (present), `N` (EN only), `Y*` (present but wording differs from EN).
- Inventory granularity: one row per dictionary key. Arrays of like items (stats, perks, board members) are collapsed into one row with an item count. Every string is covered, but not every string gets its own row.

---

## 0. Findings you should know before reading the rest

1. **Every content page is a client component** (`"use client"` plus `useLanguage()`), and all copy ships in the JS bundle. That includes `A:page.tsx`, about, contact, get-involved, resources and scholarships. Only `events`, `events/[slug]`, `recap`, `register-info`, `rsvp/[token]` and `access-denied` are server components. Moving to Sanity means moving these pages to server-side fetching.
2. **Locale is a cookie, not a URL.** `hreflang` alternates in every layout point `en-US` and `es-MX` at the same URL (`A:layout.tsx:99-105`, `A:about/layout.tsx:59-65`). Search engines will see one URL per page.
3. **Several `og:image` files do not exist.** `public/` contains only `logo.png`. These paths 404, **[inferred]** from `ls public`:
   - `/images/og-default.jpg`
   - `og-about.jpg`
   - `og-contact.jpg`
   - `og-events.jpg`
   - `og-get-involved.jpg`
   - `og-resources.jpg`
   - `og-scholarships.jpg`
   - `/og-default.jpg`, the `EventSchema` fallback at `src/components/seo/EventSchema.tsx:38`

   `src/app/opengraph-image.png` exists and may be what actually serves.
4. **No `not-found.tsx`, `error.tsx` or `global-error.tsx` exists anywhere under `src/app`.** The 404 and error pages are Next.js defaults (English only, unbranded). `notFound()` is called from the event and recap pages.
5. **Public copy still promises cut features** (see `docs/overhaul/RESTORE.md` rows `cut/sponsors`, `cut/newsletter`, `cut/volunteers`, `cut/patient-portal`):
   - Sponsorship perks "Live sponsor dashboard & analytics", "Custom ROI report post-event" and "Live engagement at sponsored event" (`T:getInvolvedPage.ts:211,224-225`).
   - Scholarship CTA "Subscribe to Newsletter" and "Sign up for our newsletter" (`T:scholarshipsPage.ts:161-162`). The button actually links to `/register-info`.
   - "Volunteer Now" and "Sign Up to Volunteer" CTAs, which go to `/contact` (`C:get-involved/WaysToHelp.tsx:35-38`, `GetInvolvedCTA.tsx:25`).
6. **Dead copy:**
   - `volunteerFormTranslation` (`T:getInvolvedPage.ts:97-165`, about 35 strings per locale) has no consumer (grep found none).
   - `navbarNavLinksTranslation` (`T:layoutPage.ts:1-8`) has no consumer. The real nav list is hardcoded in `C:layout/Navbar.tsx:16-28`.
7. **Facts that contradict each other:**
   - Impact stats say "12+ Years of Service" (`T:homePage.ts:30`). About says founded 1993, "30+ years" (`T:aboutPage.ts:5,64`).
   - The board heading says "Board of Directors 2025". The scholarship says "Spring Semester 2026" with a deadline of November 25, 2025.
   - Today is 2026-11-14, so the scholarship permanently renders "Deadline Passed".
8. **The About page board is hardcoded** (`T:aboutPage.ts:14-54`) while a `BoardRole` model assigns officers through admin. There are two sources of truth **[inferred]**.

---

## 1. TEXT INVENTORY

### 1.0 Cross-site chrome (appears on every public page)

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `C:layout/Navbar.tsx:17-27` | Nav links (7: Home, About Us, Events, Resources, Scholarships, Get Information*, Contact) | "Home", "About Us", "Events"… | Y (inline `labelEn/labelEs`) | UI |
| `C:layout/Navbar.tsx:100,144` | Nav CTA | "Get Involved" / "Participa" | Y (inline ternary) | UI |
| `C:layout/Navbar.tsx:174` | Sign In (mobile) | "Sign In" / "Iniciar Sesión" | Y (inline) | UI |
| `C:layout/Navbar.tsx:59-62` | Logo wordmark | "Hemophilia Outreach / of El Paso" | **N** (same in ES) | CONFIG |
| `C:layout/Navbar.tsx:52` | Logo alt | "Hemophilia Outreach of El Paso" | **N** | CONFIG |
| `C:layout/Navbar.tsx:107` | aria-label | "Toggle menu" | **N** | UI |
| `T:layoutPage.ts:10-23` (via `UserMenu.tsx`) | User menu (4) | "Login", "Portal", "Admin Dashboard", "Logout" | Y | UI |
| `T:layoutPage.ts:27,47` | Footer tagline | "Giving Hope To Our Community" | Y | CONTENT |
| `T:layoutPage.ts:28-34,48-54` | Footer headings and legal line (9) | "Quick Links", "Contact Us", "Connect", "All rights reserved."… | Y | UI |
| `T:layoutPage.ts:35-36,55-56` | Footer newsletter block | "Stay Informed" / "Register to hear about HOEP events…" / "Register for Information" | Y | UI (gated by `registrationOpen`) |
| `T:layoutPage.ts:37-44,57-64` | Footer links (6) | About Us, Events, Resources, Scholarships, Get Involved, Contact | Y | UI |
| `C:layout/Footer.tsx:31-34,123` | Footer wordmark and © line | "Hemophilia Outreach of El Paso" | **N** | CONFIG |
| `C:layout/Footer.tsx:74,71` | Footer phone | "(915) 621-8291" | n/a | CONFIG |
| `C:layout/Footer.tsx:83` | Footer email | `contactEmail()` | n/a | CONFIG |
| `C:layout/Footer.tsx:92,98` | Footer Facebook | `facebook.com/4HOEP`, "Facebook" | **N** | CONFIG |
| `C:layout/Footer.tsx:128-130` | Made with ♥ | "Made with ♥ for the El Paso community" | Y | UI |
| `C:LanguageSwitcher.tsx` | Language toggle | (not read in detail) | n/a | UI **[inferred]** |

\* The "Get Information" link is hidden when `registrationOpen` is false (`Navbar.tsx:32`).

**Duplicate or divergent**

- Nav labels exist twice and differ: `Navbar.tsx:16-28` includes "Get Information" and omits Get Involved. `T:layoutPage.ts:1-8` omits both and is unused. Footer links (`layoutPage.ts:37-44`) list Get Involved but not Home.
- ES vs EN tone: the footer ES "Conéctate" and "Mantente Informado" are informal (tú). "Contáctenos" is formal (usted) within the same dictionary (`layoutPage.ts:49,53`).

### 1.1 Home `/`

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `T:homePage.ts:3,13` | Hero eyebrow | "Hemophilia Outreach of El Paso" | Y* ("de El Paso") | CONFIG/CONTENT |
| `T:homePage.ts:4,14` | Hero H1 | "Giving Hope To Our Community" | Y | CONTENT |
| `T:homePage.ts:5-6` | Hero sub | "Supporting individuals and families affected by bleeding…" | Y | CONTENT |
| `T:homePage.ts:7-8` | Hero CTAs | "Get Involved", "Upcoming Events" | Y | UI |
| `T:homePage.ts:9-10` | Hero badges | "Free Support", "Community Driven" | Y | CONTENT |
| `C:home/Hero.tsx:74` | H1 highlight rule | word `"Hope"` or `"Esperanza"` gets accent colour | n/a | code hack |
| `T:homePage.ts:26-27` | Stats header | "Our Impact" / "Making a difference in the El Paso…" | Y | CONTENT |
| `T:homePage.ts:28-33` | Stats ×4 | 150+ Families Served, 12+ Years of Service, 50+ Events Hosted, 100% Free of Charge | Y | CONTENT |
| `T:homePage.ts:49-51` | Upcoming events header | "Upcoming Events" / "Join us for educational programs…" | Y | CONTENT |
| `T:homePage.ts:52-56` | Feed chrome (5) | "No upcoming events at this time…", "View All Events", "spots left", "Event full", "Learn More & RSVP" | Y | UI |
| `T:registerInfoPage.ts:103-106` | Register band (3), shown only if `registrationOpen` | "Register for Information" / "Tell us about your household…" / "Register now" | Y | CONTENT/UI |

**Flags**

- "Giving Hope To Our Community" is duplicated: hero H1 (`homePage.ts:4`) and footer tagline (`layoutPage.ts:27`). Same EN and ES.
- The ES eyebrow uses "Hemophilia Outreach **de** El Paso" (`homePage.ts:13`). Layout metadata and consent text use "of" in ES (`A:layout.tsx:25`, `content/consent.ts`). The org name is inconsistent in ES (6 "de" vs 56 "of" occurrences).
- ES register-band sub is tú-form. The ES upcoming-events subtitle on the same page is usted-form (`homePage.ts:61`).

### 1.2 About `/about`

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `T:aboutPage.ts:3-5` | Hero | "Our Story" / "Three Decades of Hope" / "Founded in 1993 by Lou Anne Fetters…" | Y | CONTENT |
| `T:aboutPage.ts:58-66` | Founder spotlight (9: eyebrow, name, title, founded, quote, body, 3 badges) | "Lou Anne Fetters — Founder & Visionary", "No family should face a bleeding disorder diagnosis alone." | Y | CONTENT |
| `C:about/FounderSpotlight.tsx:40` | Avatar initials | "LF" (hardcoded) | n/a | CONTENT |
| `T:aboutPage.ts:84-99` | Founder story (heading, 3 paragraphs, credit, hall-of-fame label, 4 names) | "A Mother's Love, A Community's Hope", "In 1993, Lou Anne Fetters…" | Y* | CONTENT |
| `C:about/FounderStory.tsx:59-68` | "1993" card | "Year Founded" / "Over 30 years serving…" | Y (inline ternary, **not in dictionary**) | CONTENT |
| `C:about/FounderStory.tsx:74` | Hall-of-fame icon | 🏛️ | n/a | decoration |
| `T:aboutPage.ts:123-163` | Mission, Objective, Goal (3 emoji cards with title and body) and "What We Do" (4 values with icon key, title, body) | "Our Mission — To offer support to individuals and their families…" | Y | CONTENT |
| `T:aboutPage.ts:36-43` | Board header | "Leadership" / "Board of Directors 2025" / "We are currently welcoming new board members…" | Y | CONTENT (stale year) |
| `T:aboutPage.ts:40-42` | Board group labels (3) | "Executive Board", "Officers", "Advisor" | Y | UI/CONTENT |
| `T:aboutPage.ts:14-33` | Board people (1 executive + 8 officers) | names and Gmail addresses | **N** (title only has EN/ES for exec) | CONTENT + CONFIG |
| `T:aboutPage.ts:43,52` | Advisor | "Rich Lopez" + email, duplicated in both locale blocks | Y (dup) | CONTENT + CONFIG |
| `T:aboutPage.ts:212-215` | CTA band | "Ready to Get Involved?" / "Whether you're a family affected…" / "Get Involved" / "Contact Us" | Y | CONTENT/UI |
| `A:about/layout.tsx:12-26` | Metadata (title, description, ogTitle, ogDescription) | "About Us", "Learn about Hemophilia Outreach of El Paso (HOEP)…" | Y | CONTENT |
| `A:about/layout.tsx:47` | OG alt | "HOEP Team" / "Equipo de HOEP" | Y | CONTENT |

**Flags**

- ES typo: "La visión de **Lou Ann**" (`aboutPage.ts:107`) vs "Lou Anne" everywhere else.
- Executive card: title exists in both locales. Officers have no titles at all. Names are not localized (correct).
- The hall of fame list ("Lou Anne Fetters, Rosamaria Coles, Felix Garcia, Yolanda Ortiz") is duplicated in both locale blocks (`aboutPage.ts:94-99,112-117`). Heading ES: "Pasados Presidentes - Salón de la Fama".
- ES CTA is tú-form ("para ti"). Everything else on the page is usted.
- Fact repeats: "over 150 families" appears in the spotlight body (`aboutPage.ts:63`) and in Impact stats (`homePage.ts:29`).
- No photos for any person. Avatars are initials computed in code (`BoardOfDirectors.tsx:82-86,112-116`).

### 1.3 Resources `/resources`

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `T:resourcesPage.ts:3-5` | Hero | "Knowledge & Support" / "Resources for Our Community" / "Everything you need to navigate life…" | Y | CONTENT |
| `T:resourcesPage.ts:16-18` | Conditions header | "Understanding Bleeding Disorders" / "Condition Information" | Y | CONTENT |
| `T:resourcesPage.ts:19-60` | Conditions ×3 (Hemophilia A, B, VWD: name, abbr, color token, "What is it?", body, 4 facts, link, "Learn More at NHF") | "Hemophilia A is the most common form…" | Y* | CONTENT (medical) |
| `T:resourcesPage.ts:112-117` | National orgs header | "National Support" / "National Organizations" | Y | CONTENT |
| `T:resourcesPage.ts:119-152` | National orgs ×4 (NHF, HFA, CDC, NBDF: abbr, name, body, link, color) | "National Hemophilia Foundation — The leading national…" | Y | CONTENT |
| `T:resourcesPage.ts:193-198` | Local header | "Local Care" / "El Paso Area Resources" | Y | CONTENT |
| `T:resourcesPage.ts:199-229` | Local providers ×3 (UMC, TTHSC, EPCH: name, abbr, type, address, phone, body, link) | "University Medical Center of El Paso", "4815 Alameda Ave…", "(915) 521-7602" | Y | CONTENT + CONFIG (third-party contact data) |
| `T:resourcesPage.ts:263-` | Camps header | "Youth Programs" / "Camps & Youth Opportunities" | Y | CONTENT |
| `T:resourcesPage.ts:~265-300` | Camps ×2 (Camp Bold Eagle, NHF Youth Programs: name, org, body, ages, season, cost, link) | "Ages 6–17", "Summer", "Scholarships Available" | Y | CONTENT |
| `T:resourcesPage.ts:~335-` | Insurance header | "Financial Assistance" / "Insurance & Financial Help" | Y | CONTENT |
| `T:resourcesPage.ts:~340-370` | Insurance ×3 (icon key, title, body, cta, link; the 3rd is internal `/contact`) | "HFA Patient Assistance", "NHF Insurance Advocacy", "Contact HOEP Directly" | Y | CONTENT |
| `A:resources/layout.tsx:12-26` | Metadata | "Resources", "Access educational resources…" | Y | CONTENT |

(Line numbers after about 260 are approximate because I read this file via `sed` and the file is about 385 lines.)

**Flags**

- ES leak: `"Named after Stephen Christmas, el primer paciente descrito"` (`resourcesPage.ts:~84`) has an English half-sentence in the ES block.
- NHF and NBDF are listed as separate organizations. The NBDF body says "Formerly NHF…". Same org, so editorial fix needed. NHF links also point to `hemophilia.org`.
- Mixed "Von Willebrand Disease" / "von Willebrand disease" / "Enfermedad de von Willebrand" / "Von Willebrand" (also `lib/patients/diagnoses.ts` labels).
- External-link labels "Learn More at NHF" are repeated 3× per locale instead of being one UI string.
- Provider phone numbers and addresses are third-party facts that go stale. They want a `lastVerified` field.
- Camp costs are inconsistent in ES: "Gratis" for "Free to Attend", but "Free of Charge" elsewhere is "Gratuito".

### 1.4 Get Involved `/get-involved`

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `T:getInvolvedPage.ts:5-7` | Hero | "Make a Difference" / "Get Involved With HOEP" / "Whether you volunteer your time…" | Y | CONTENT |
| `T:getInvolvedPage.ts:18-20` | Ways header | "How You Can Help" / "Ways to Get Involved" | Y | CONTENT |
| `T:getInvolvedPage.ts:21-54` | Ways ×4 (Lucide icon *component*, title, body, color token, anchor, CTA) | "Volunteer Your Time", "Sponsor an Event", "Spread the Word", "Join the Board" | Y* | CONTENT |
| `T:getInvolvedPage.ts:97-165` | **Volunteer form dictionary (dead)** | "Sign Up to Volunteer"… | Y | UI (dead) |
| `T:getInvolvedPage.ts:169-174` | Sponsorship header (4) | "Sponsorship Opportunities", "Your sponsorship directly funds…", "Interested in sponsoring? Contact us at" | Y | CONTENT |
| `T:getInvolvedPage.ts:173-174` | Tier chrome | "★ Most Popular", "Inquire About This Tier" | Y | UI |
| `T:getInvolvedPage.ts:175-241` | Tiers ×5 (Bronze $250+, Silver $500+, Gold $1,000+ featured, Platinum $2,500+, Custom; name, price, colour, perks[3-6]) | "Table for 4 at educational dinner" | Y* | CONTENT |
| `C:get-involved/SponsorshipTiers.tsx:38` | Inline badge text | "Most Popular" (`primary` style `badge` field, EN only) | **N** | UI (likely unused: translation `mostPopular` is the real one **[inferred]**) |
| `C:get-involved/SponsorshipTiers.tsx:144` | Sponsor contact mailto | `contactEmail()` | n/a | CONFIG |
| `T:getInvolvedPage.ts:322-326` | CTA band | "Ready to Make a Difference?" / "Volunteer Now" / "Contact Us" | Y | CONTENT/UI |
| `A:get-involved/layout.tsx:12-26` | Metadata | "Get Involved", "Join the Hemophilia Outreach of El Paso…" | Y | CONTENT |

**Flags (EN vs ES wording differs)**

- "Sponsor an Event" body: EN adds "See our sponsorship tiers below." and ES omits it (`getInvolvedPage.ts:33` vs `:72`).
- "Join the Board" body: EN has a second sentence ("Bring your skills, passion, and time to our leadership team."), ES drops it (`:49` vs `:88`).
- Platinum perks: EN "Live sponsor dashboard & analytics" / "Custom ROI report post-event", ES "Panel de patrocinador en vivo" / "Informe de ROI personalizado" (shortened). Gold perk "Live engagement at sponsored event" maps to ES "Participación en vivo en el evento".
- Two different CTA anchors ("#volunteer" rewritten to `/contact` in `WaysToHelp.tsx:37`) mean the CMS link field must be a URL or reference, not an anchor string.
- Tier prices and perks are hardcoded dollar amounts (legally and financially sensitive).

### 1.5 Scholarships `/scholarships`

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `T:scholarshipsPage.ts:4-6` | Hero | "Educational Support" / "Scholarships" / "Hemophilia Outreach of El Paso is proud to support students…" | Y | CONTENT |
| `T:scholarshipsPage.ts:17-37` | Scholarship card (heading, semester, in-memory, amount "$500", recipients "3 Students", deadline "November 25, 2025", essay prompt, essay length, status labels, labels) | "Jesus M. Terrazas & Luis Ostos Memorial Scholarship" | Y | CONTENT |
| `C:scholarships/ScholarshipCard.tsx:12` | Deadline logic | `new Date("2025-11-25")` hardcoded in the component | n/a | **code-owned date duplicating the text field** |
| `T:scholarshipsPage.ts:34-35` | Apply URL | `apply: "Apply at"`, `applyUrl: siteHost()` | Y | CONFIG (no component usage found **[inferred]**) |
| `T:scholarshipsPage.ts:66-94` | Eligibility header and 6 requirements (title, body) | "Minimum GPA of 2.5", "Must be a United States resident." | Y* | CONTENT |
| `T:scholarshipsPage.ts:131-141` | Contacts header and 1 coordinator | "Teresita Fernandez de Robles, Vice President, HOEP, tfernandezr.hoep@gmail.com, (915) 621-8291" | Y (dup) | CONTENT + CONFIG |
| `T:scholarshipsPage.ts:160-163` | CTA band | "Want to Be Notified About Future Scholarships?" / "Subscribe to Newsletter" / "Contact Us" | Y | CONTENT/UI |
| `A:scholarships/layout.tsx:12-27` | Metadata | "Scholarships", "Apply for the Jesus M. Terrazas and Luis Ostos…" | Y | CONTENT |

**Flags**

- ES GPA requirement is different: EN "…during the entire senior year of high school, or current year of college or graduate school." / ES "…durante el año escolar actual." (`:84` vs `:115`). **A substantive eligibility difference, not just wording.**
- The essay prompt is duplicated: `essayPrompt` in the card (`:32`) and inside the eligibility body (`:92`), both locales.
- Coordinator name, title, email and phone are duplicated verbatim from the About page executive record (`aboutPage.ts:17-20`) and appear twice here (EN and ES blocks).
- The "Newsletter" wording conflicts with the "Register for Information" naming used everywhere else (section 1.9).

### 1.6 Contact `/contact`

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `T:contactPage.ts:3-5` | Hero | "Get In Touch" / "We're Here For You" / "Whether you're a family affected…" | Y | CONTENT |
| `T:contactPage.ts:16-36` | Contact form: heading, sub, field labels (6), submit and sending, success head and body, reason select (7 options) | "Send Us a Message", "Reason for Contact", "General Inquiry" | Y | UI (heading/sub = CONTENT) |
| `C:contact/ContactForm.tsx:55-63` | Inline error strings (2) | "Failed to send. Please try again." / "Connection error. Please try again." | Y (inline ternary) | UI |
| `T:contactPage.ts:67-75` | Info card labels (Phone, Email, Location, Office Hours, Follow Us) | | Y | UI |
| `T:contactPage.ts:73-74` | Hours, location, note | "Monday – Friday, 9:00 AM – 5:00 PM", "El Paso, Texas", "We serve the greater El Paso…" | Y | CONFIG / CONTENT |
| `C:contact/ContactInfo.tsx:27-28` | Phone | "(915) 621-8291", `tel:+19156218291` | n/a | CONFIG |
| `C:contact/ContactInfo.tsx:55,67` | Facebook | `facebook.com/hemoelpaso`, "@hemoelpaso" | n/a | CONFIG (**different URL from footer**) |
| `T:contactPage.ts:92-94` | Map header | "Find Us" / "Proudly serving El Paso… since 1993." / "Get Directions" | Y | CONTENT/UI |
| `C:contact/ContactMap.tsx:27,34,45,47,49` | Map embed and overlay | Google embed URL, title "El Paso, Texas", "Hemophilia Outreach of El Paso", maps link | **N** | CONFIG |
| `A:contact/layout.tsx:12-26` | Metadata | "Contact Us", "Get in touch with Hemophilia Outreach…" | Y | CONTENT |

**Flags**

- The contact form reason list is duplicated in `M:ContactFormNotification.tsx:23-29` (`reasonLabels`, same EN/ES wording) and sent to the board. Reasons also drive routing in `lib/contact-routing.ts` **[inferred]**.
- Auto-reply email HTML lives in `src/app/api/contact/route.ts:72-105` (not a template), with the name interpolated unescaped into HTML **[note for dev, not CMS]**.
- ES hero wording "Estamos Aquí Para Usted" is formal. The ES "Síguenos" label is informal (`contactPage.ts:83`).
- No street or mailing address exists anywhere on the public site (only "El Paso, Texas").

### 1.7 Events list `/events`

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `T:eventsPage.ts:3-7` | Page header and empty state | "Events & Programs" / "Join us for educational programs…" / "No Events Scheduled" | Y* (ES subtitle ends with period) | CONTENT/UI |
| `T:eventsPage.ts:21-35` | Controls (search, tabs, view toggles, caption, spots, full…) | "Search events...", "Upcoming events", "Past Events", "Learn more and RSVP" | Y | UI |
| `C:events/EventFilterOptions.tsx:~27,143-144` | Filter labels, inline dict | "All"/"Todos", "Statuses"/"los Estados", "Categories" | Y (inline) | UI |
| `C:events/EventSlidePanel.tsx:11-35` | Quick-RSVP slide panel dictionary (11 keys) | "Quick RSVP", "RSVP'd!", "Failed — try again" | Y (inline, **separate dict**) | UI |
| `C:events/FlyerPreview.tsx:~214-230` | Flyer dict | "Event Flyers", "View English Flyer" | Y (inline) | UI |
| `C:events/BackButton.tsx:~95-100` | Back button dict | "Back to Events" / "Volver a Eventos" | Y (inline, dup of `eventsPage.ts:58`) | UI |
| `lib/event-utils.ts:50-56` | Status labels | "Upcoming", "Live Now", "Past Event", "Cancelled", "Draft" | Y | UI |
| `A:events/layout.tsx:12-26` | Metadata | "Events", "Discover upcoming educational dinners…" | Y | CONTENT |
| DB `Event.titleEn/Es`, `descriptionEn/Es`, `location` | Event data | per-event | Y (columns) | CONTENT (**stays in DB**) |

**Flags**

- "RSVP" CTA wording across five places disagrees (`Learn More & RSVP` in `homePage.ts:56` and `EventSlidePanel.tsx:13`, `Learn more and RSVP` in `eventsPage.ts:29`, `RSVP` in `eventsPage.ts:73` and `EventPageContent.tsx:192`, `Reserve your spot`, `Quick RSVP`).
- Capacity wording disagrees: "No Event Limit" (`eventsPage.ts:33`), "Open Attendance" (`EventSlidePanel.tsx:16`), "Unlimited" (`eventsPage.ts:76`).
- ES "No hay próximos eventos…" vs "No hay eventos próximos…" (`homePage.ts:62` vs `eventsPage.ts:45`).

### 1.8 Event detail `/events/[slug]` and recap

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `T:eventsPage.ts:58-76` | Detail chrome (17 keys) | "Back to Events", "Event Details", "Quick Info", "Date & Time"… | Y | UI |
| `C:events/event-page/EventPageContent.tsx:72` | RSVP heading | "RSVP for this event" / "Confirma tu asistencia" | Y (inline) | UI (also at `registerInfoPage.ts:26,75`) |
| `…EventPageContent.tsx:94-108` | Recap teaser | "Event Recap", "Read the full recap with photos.", "Read Recap" | Y (inline) | UI |
| `…EventPageContent.tsx:185-214` | RSVP status card | "Reserve your spot", "To RSVP, call 915-621-8291.", "This event is full…", "Registration closed…", "To RSVP, use the link in your invitation…" | Y (inline) | UI (**embeds phone**) |
| `…EventPageContent.tsx:~158` | Date join | `${date.full} at ${date.time}` | **N** (English "at" in ES) | UI bug |
| `…EventPageContent.tsx:~136-142` | Gallery placeholder (6 empty tiles) | `t.photoGallery` | Y | UI |
| `A:events/[slug]/recap/page.tsx:51,57,98,105,117,120` | Recap page chrome (6) | "Back to event", "Event Recap", "Photo Gallery", "All events" | Y (inline ternaries) | UI |
| DB `Event.recapTitleEn/Es`, `recapBodyEn/Es`, `recapGalleryEmbedUrl` | Recap content | per-event | Y | CONTENT (stays in DB, body is plain text split on `\n` at `recap/page.tsx:81`) |
| `A:events/[slug]/page.tsx` | **No `generateMetadata`** (no title, description or OG for event pages) **[inferred]** | | n/a | SEO gap |
| `src/components/seo/EventSchema.tsx:17-51` | JSON-LD Event | hardcoded "El Paso", "TX", "US", price "0", +2h endDate | n/a | CONFIG |

### 1.9 Register for Information `/register-info` (closed by default)

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `T:registerInfoPage.ts:3-5` | Title, intro | "Register for Information" / "Tell us a little about your household…" | Y | CONTENT |
| `T:registerInfoPage.ts:6-18` | Form labels (13) | "First name", "Mailing address", "Preferred language", "Number of people in your household" | Y | UI |
| `T:registerInfoPage.ts:18-20` | Diagnosis prompt and hint | "Does anyone in your household have… a bleeding disorder?" / "We never include it in emails." | Y | **LEGAL/PHI-adjacent** |
| `lib/patients/diagnoses.ts:21-32` | Diagnosis options (6 labels) | "Hemophilia A"… "Carrier" | Y | UI (PHI-related) |
| `T:registerInfoPage.ts:21-24` | Consent headings and labels | "Consent", "I agree (required)", "I agree (optional)" | Y | LEGAL |
| `src/content/consent.ts:14-19` | **Consent bodies** (`data_and_contact`, `media`) with `CONSENT_TEXT_VERSION = "draft-1"` | "I agree that Hemophilia Outreach of El Paso (HOEP) may store…[DRAFT - pending board approval]" | Y (ES has `[BORRADOR…]`) | **LEGAL** |
| `T:registerInfoPage.ts:25-37` | Submit, RSVP variants, success, full, closed (contain the phone number) | "Register", "You're on the list!" | Y | UI |
| `T:registerInfoPage.ts:38-48` | Validation errors (9) | "Please enter your first name." | Y | UI |
| `C:register-info/RegistrationClosed.tsx:9-19` | **Closed-registration page** | "Online registration isn't open yet" / "To register or RSVP, please call us. We're happy to help." / "Contact us" | Y (inline `copy`) | UI (+ phone from `CALL_US_PHONE`) |
| `A:register-info/layout.tsx:11-16` | Metadata | "Register for Information" + description | Y | CONTENT |

**Flags**

- **Consent text is a draft with a literal `[DRAFT - pending board approval]` tag** (visible to visitors once registration opens).
- ES tone for this form is tú-form; the rest of the site (contact, about) is usted. See the "register" flag in section 7.

### 1.10 RSVP `/rsvp/[token]`

| Location | Section | EN (≤60) | ES? | Class |
|---|---|---|---|---|
| `T:rsvpPage.ts:3-30` | Entire panel (27 strings plus 2 template functions `hi()` and `confirmedFor()`) | "This link isn't valid", "You're invited to", "Cancel my RSVP", "Email me my QR code" | Y | UI |
| `T:rsvpPage.ts:4,24,26,27` | Phone-bearing sentences (4) | "Please call us at 915-621-8291." | Y | UI (**phone embedded**) |
| `C:rsvp/RsvpPanel.tsx:144` | QR image alt | `alt="QR"` | **N** | UI |
| `A:rsvp/[token]/page.tsx:8` | Metadata | "RSVP" (noindex, no referrer) | **N** | UI |

### 1.11 Other public routes (not in the page list but visible)

| Route | Location | Strings | ES? | Class |
|---|---|---|---|---|
| `/access-denied` | `A:access-denied/page.tsx:12-32` | "Board members only", "This login is for HOEP board members only.", "Sign-in problem", "Sign in with a different account", "Back to homepage", "Contact us" (7 strings) | Y | UI |
| `/access-denied` | `:8` | metadata "Access denied" | **N** | UI |
| `/unsubscribe` | `A:unsubscribe/page.tsx:23-66` | "You've been unsubscribed", body, "Contact Us", "Return to homepage", "Unsubscribe failed", 2 error bodies | **N (EN only, no locale hook)** | UI |
| 404 / 500 | none defined | Next.js defaults | **N** | UI |
| `/robots.txt`, `/sitemap.xml` | `src/app/robots.ts`, `src/app/sitemap.ts` | no copy | n/a | config |

### 1.12 Global metadata and JSON-LD

| Location | Item | Notes |
|---|---|---|
| `A:layout.tsx:15-32` | Default title, description, ogTitle, ogDescription (EN and ES) | Y |
| `A:layout.tsx:49-68` | Keywords (7 per locale) | Y |
| `A:layout.tsx:43,70,77,87` | Title template, authors, siteName, OG alt "HOEP Logo" | Org name; the `locale === "es" ? X : X` ternaries have identical arms |
| `A:{about,contact,events,get-involved,resources,scholarships}/layout.tsx` | Per-page title, description, ogTitle, ogDescription, OG alt, image (EN and ES) | Y; 6 files × 4 strings × 2 locales = 48 strings |
| `src/components/seo/OrganizationSchema.tsx:6-32` | JSON-LD NonProfit: name, alternateName, description, foundingDate "1993", address (locality El Paso, TX, US), phone "+1-915-621-8291", email, `sameAs` Facebook, areaServed | EN only |

### 1.13 Inventory flag summary

| Flag | Count | Where |
|---|---|---|
| EN-only public strings | about 12 | unsubscribe page (7), `Toggle menu`, `Close`, QR `alt`, flyer `title="Flyer Preview"`, map `title`, "RSVP" metadata, "Access denied" metadata |
| ES-only strings | 0 found | none |
| EN-only emails | 3 templates | see section 2 |
| EN vs ES substantive difference | 6 | GPA requirement; Sponsor an Event body; Join the Board body; Platinum perk shortening ×2; "Named after Stephen Christmas" leak |
| Duplicate strings, same wording | 8 groups | tagline; phone sentences; essay prompt; coordinator record; reason list; hall of fame names; nav list; BackButton label |
| Duplicate concept, different wording | 6 groups | RSVP CTA (5 variants); capacity wording (3); "Register for Information" / "Get Information" / "Stay Informed" / "Subscribe to Newsletter" / "Register now"; "Registration is closed" vs "Registration closed"; org name "of"/"de" in ES; "Von Willebrand" casing |

---

## 2. EMAILS (assume they stay in code)

All are React Email components in `src/messages/`. Sender, subject and `EmailTemplate` DB rows (`prisma/schema.prisma:223`) are separate from the body copy.

| Template | Sent from | Audience | Locales | Text source | Class | Hardcoded phone or URL |
|---|---|---|---|---|---|---|
| `M:RsvpEmail.tsx` (RSVP confirmation and QR) | `lib/rsvp/emails.ts:44` (subject) | Public visitor | **EN+ES** | inline `copy` dict `:37-62` | UI/CONTENT | **Phone `915-621-8291` at `:48,62`**; brand colour `#8B1538`; uses `rsvpUrl` |
| `M:EventInvitation.tsx` | `lib/invitations/send.ts:76-79` (bilingual subject) | Invited patient | **EN+ES** | inline `copy` `:30-56` | UI | none; unsubscribe URL passed in |
| `M:RegistrationInfoConfirmation.tsx` | `lib/patients/confirmation.ts:16` (subject ternary) | Public visitor | **EN+ES** | inline `copy` `:22-41`; default `firstName="Friend"` | UI | `contactEmail()` |
| `M:ContactFormNotification.tsx` | `app/api/contact/route.ts:61-63` | **Board (internal)** | EN+ES via `isEs` ternaries | inline; `reasonLabels` `:23-29` duplicates form options | UI | default prop `jane@example.com` |
| (auto-reply, no template file) | `app/api/contact/route.ts:72-105` | Public visitor | EN+ES | **HTML string literals in the route** | CONTENT | `contactEmail()`, org name, `#8B1538` |
| `M:BoardRoleAssigned.tsx` | `lib/email-service.ts` **[inferred]** | Board (internal) | EN+ES | inline `copy` `:23-58` | UI | "El Paso, Texas" `:116`; `contactEmail()` |
| `M:EventPublished.tsx` | `lib/email-service.ts` **[inferred]** | Patients | **EN only** | inline JSX | CONTENT/UI | `process.env.NEXT_PUBLIC_BASE_URL` ×3 (`:100,106,124`), not `siteUrl()` |
| `M:EventCancelled.tsx` | `lib/email-service.ts` **[inferred]** | Patients | **EN only** | inline JSX incl. bullets `:87,91` | CONTENT/UI | `NEXT_PUBLIC_BASE_URL` (`:103`), `mailbox("events")` (`:120`) |
| `M:CheckInConfirmation.tsx` | `lib/email-service.ts`, admin test route | Attendee | **EN only** | inline JSX; sample props default to "UMC El Paso Conference Center" | UI | `contactEmail()` |

**Notes**

- Reachability of `EventPublished`, `EventCancelled`, `CheckInConfirmation` and `BoardRoleAssigned` via `email-service.ts` was not traced. **[inferred]**
- Sender addresses are derived from `mailbox()`: `noreply@`, `events@`, `info@`. The `onboarding@resend.dev` fallbacks in `lib/resend.ts:8` and `lib/email/send.ts:68` are non-production.
- Two domains are referenced. `lib/site.ts:5` documents the site as `hemoelpaso.org`, and the mail default is `hemo-el-paso.org` (`:28`). `contactEmail()` is therefore `info@hemo-el-paso.org` unless `NEXT_PUBLIC_EMAIL_DOMAIN` is set.
- The email brand colour `#8B1538` is hardcoded in at least 3 files.
- Rule 4 of `.claude/CLAUDE.md` (no diagnosis in emails) is respected in the visible copy. `EventInvitation.tsx:15` says so explicitly.

---

## 3. PAGE STRUCTURE

"Code" = interactive or data-driven. "Content" = pure editorial. Every section is wrapped in `C:layout/Section.tsx` (backgrounds `white|neutral|primary|dark`, optional `id`) unless noted.

### 3.1 Home `/` (`A:page.tsx`, client)

| # | Layout | Content | Component | Owner |
|---|---|---|---|---|
| 1 | Hero, full-height dark gradient, eyebrow, H1 with accent word, sub, 2 CTAs, 2 badge pills, decorative circles and grid | headline, sub, CTAs, badges | `C:home/Hero.tsx` | Content (accent-word hack is code) |
| 2 | Stats, 4 animated counters | heading, sub, 4 × value/suffix/label | `C:home/ImpactStats.tsx`, `ImpactStatCard`, `ui/AnimatedCounter` | Content |
| 3 | Event feed, 3 `EventCard`s from `EventsContext`, empty and loading states, "View all" | header, empty text | `C:home/UpcomingEvents.tsx`, `events/EventCard.tsx` | **Code** (feed); header is content |
| 4 | CTA band (primary background, icon), only if `registrationOpen` | heading, sub, CTA | `C:home/RegisterInfoSection.tsx` | Content, flag-gated by code |

### 3.2 About `/about`

| # | Layout | Content | Component | Owner |
|---|---|---|---|---|
| 1 | Hero, compact dark gradient | eyebrow, H1, sub | `C:about/AboutHero.tsx` | Content |
| 2 | Two-column text + aside: left eyebrow/H2/3 paragraphs/credit row, right gradient "1993" card + hall-of-fame list | as listed | `C:about/FounderStory.tsx` | Content (part of the aside is inline, not dictionary) |
| 3 | Card trio (emoji, title, body) then 4-up icon grid ("What We Do") | 3 + 4 items | `C:about/MissionValues.tsx` (+`HoepCard`) | Content |
| 4 | Featured-person card: dark gradient, initials avatar, name, title, founded, quote, body, 3 badges | one person | `C:about/FounderSpotlight.tsx` | Content |
| 5 | People grid in 3 groups (executive cards 4-up, officers 4-up compact, advisor single) | name, title, email | `C:about/BoardOfDirectors.tsx` | Content (data in `T:aboutPage.ts` non-localized export) |
| 6 | CTA band, neutral, 2 buttons | heading, sub, 2 CTAs | `C:about/AboutCTA.tsx` | Content |

### 3.3 Resources `/resources`

| # | Layout | Content | Component | Owner |
|---|---|---|---|---|
| 1 | Hero compact | eyebrow, H1, sub | `C:resources/ResourcesHero.tsx` | Content |
| 2 | Three-up rich cards (colour, abbr badge, "What is it?", body, fact bullets, external link) | 3 conditions | `C:resources/ConditionCards.tsx` | Content |
| 3 | Org cards grid (abbr, name, body, link, colour) | 4 orgs | `C:resources/NationalOrgs.tsx` | Content |
| 4 | Provider cards (abbr, name, type, address, phone, body, link, colour) | 3 providers | `C:resources/LocalResources.tsx` | Content |
| 5 | Program cards (name, org, body, ages, season, cost, link) | 2 camps | `C:resources/CampPrograms.tsx` | Content |
| 6 | Link cards with icon (dollar, shield, phone), one internal | 3 items | `C:resources/InsuranceResources.tsx` | Content |

### 3.4 Get Involved `/get-involved`

| # | Layout | Content | Component | Owner |
|---|---|---|---|---|
| 1 | Hero compact | eyebrow, H1, sub | `C:get-involved/GetInvolvedHero.tsx` | Content |
| 2 | 2-up icon cards with CTA link (4) | title, body, colour, link | `C:get-involved/WaysToHelp.tsx`, `WayCard.tsx` | Content (`#volunteer` to `/contact` rewrite is code) |
| 3 | Pricing tiers (5; featured gold; perks checklist; mailto CTA) | name, price, perks | `C:get-involved/SponsorshipTiers.tsx` | Content |
| 4 | CTA band, white, 2 buttons (both link to `/contact`) | heading, sub, CTAs | `C:get-involved/GetInvolvedCTA.tsx` | Content |

### 3.5 Scholarships `/scholarships`

| # | Layout | Content | Component | Owner |
|---|---|---|---|---|
| 1 | Hero compact | eyebrow, H1, sub | `C:scholarships/ScholarshipsHero.tsx` | Content |
| 2 | Program card: banner (semester, title, open/closed pill), 3-stat row, in-memory note, deadline-passed notice, essay prompt | all | `C:scholarships/ScholarshipCard.tsx` | Content, **with code-owned date logic** (`:12`) |
| 3 | Checklist/cards (6 requirements) | title, body | `C:scholarships/EligibilityRequirements.tsx` | Content |
| 4 | Contact cards (name, title, mailto, tel) | 1 person | `C:scholarships/ScholarshipContacts.tsx` | Content/CONFIG |
| 5 | CTA band, white, 2 buttons (register button gated by `registrationOpen`) | heading, sub, CTAs | `C:scholarships/ScholarshipCTA.tsx` | Content, flag-gated |

### 3.6 Contact `/contact`

| # | Layout | Content | Component | Owner |
|---|---|---|---|---|
| 1 | Hero compact | eyebrow, H1, sub | `C:contact/ContactHero.tsx` | Content |
| 2 | Two-column: form (2/3) + info sidebar (1/3) | form chrome; phone, email, location, hours, Facebook, note | `C:contact/ContactBody.tsx`, `ContactForm.tsx`, `ContactInfo.tsx` | **Code** (form → `/api/contact`); info card is CONFIG |
| 3 | Map embed with overlay card | heading, sub, directions link | `C:contact/ContactMap.tsx` | CONFIG (hardcoded Google embed URL) |

### 3.7 Events list `/events` (`A:events/page.tsx`, server → `EventsPageContent`)

| # | Layout | Content | Component | Owner |
|---|---|---|---|---|
| 1 | Hero, title-only gradient | title, subtitle | `C:events/EventsPageContent.tsx:22-30` | Content |
| 2 | Event directory: search, category filter, list/grid/calendar toggle, upcoming and past tabs, slide panel with quick-RSVP | all | `PublicEventsDisplay`, `EventsGrid`, `EventsList`, `EventsCalendar`, `EventSlidePanel`, `EventCard` | **Code** |
| 3 | Empty state | title, subtitle | `EventsPageContent.tsx:34-43` | UI |

### 3.8 Event detail `/events/[slug]`

| # | Layout | Content | Component | Owner |
|---|---|---|---|---|
| 1 | Hero (status chip, title, date, time, location, back button) | DB event | `C:events/event-page/EventPageHero.tsx` | **Code** (DB) |
| 2 | Main column: details card (description), RSVP form (if registration open), past notice, recap teaser or empty photo-grid | | `EventPageContent.tsx` + `register-info/RegisterInfoForm` | **Code** |
| 3 | Sidebar: quick info, flyer preview, RSVP status card (4 variants) | | `EventPageContent.tsx`, `events/FlyerPreview.tsx` | **Code** |

### 3.9 Recap `/events/[slug]/recap`

Single column: back link, eyebrow/H1/date/location, plain-text body card (split on `\n`), Google-photos-style iframe embed, footer nav (`A:events/[slug]/recap/page.tsx`). **Code** (DB-driven). 404 until `recapPublishedAt` is set.

### 3.10 Register-info `/register-info`

Centered form (`RegisterInfoHeading` + `RegisterInfoForm` with Turnstile, address autocomplete, consent) or `RegistrationClosed` card (icon, title, body, phone number, contact button). **Code** (forms, flag). Copy sources in 1.9.

### 3.11 RSVP `/rsvp/[token]`

One panel (`C:rsvp/RsvpPanel.tsx`) with 5 states: invalid link, invitation (yes/no + party size), confirmed (QR + update/cancel), declined, ended/full/closed. **Code** (token resolution, QR, rate-limited resend).

---

## 4. BLOCK CANDIDATES

`SectionHeader` (eyebrow, heading, sub, alignment) appears in 14 sections and should be a shared **object type**, not a block.

| # | Block | Pages | Fields | Variants in use | Replaces |
|---|---|---|---|---|---|
| 1 | **PageHero** | home, about, resources, get-involved, scholarships, contact, events | eyebrow, heading (with optional emphasised word), sub, CTAs[0-2] (label, link, style), badges[0-n], height | `full` (home: tall, badges, circles+grid), `compact` (about/resources/get-involved/scholarships/contact: identical gradient), `titleOnly` (events: no eyebrow, `py-16`) | `Hero`, `AboutHero`, `ResourcesHero`, `ContactHero`, `GetInvolvedHero`, `ScholarshipsHero`, events hero |
| 2 | **CardGrid** | about (mission trio, values), get-involved (ways), resources (insurance) | header, columns 2/3/4, cards[] (emoji or icon key, title, body, accent colour, optional link and label) | `emoji` (HoepCard centered), `icon-circle` (values), `icon-square + CTA link` (ways, insurance) | `MissionValues`, `WaysToHelp`, `WayCard`, `InsuranceResources` |
| 3 | **EntryGrid** (directory) | resources (conditions, national orgs, providers, camps) | header, entries[] (abbr, name, kicker/type, body, bullets[], address, phone, meta chips[] (ages/season/cost), link, accent colour) | `rich` (conditions: bullets + "What is it?"), `org` (abbr + body), `provider` (address, phone), `program` (meta chips) | `ConditionCards`, `NationalOrgs`, `LocalResources`, `CampPrograms` |
| 4 | **StatsRow** | home | header, stats[] (number, suffix, label), animate toggle | `counter-cards` (home); scholarship's 3-up icon stat strip is a variant | `ImpactStats`, the `StatCell` row inside `ScholarshipCard` |
| 5 | **TextWithAside** | about (founder story) | eyebrow, heading, paragraphs (rich text), credit (name, title), aside (type: `bigNumber` or `nameList`) | one use now: the aside is a gradient "1993" card plus a list | `FounderStory` |
| 6 | **FeaturedPerson** | about (founder spotlight) | name, title, subtitle, quote, body, photo or initials, badges[] | one use | `FounderSpotlight` |
| 7 | **PeopleGrid** | about (board), scholarships (coordinators) | header, groups[] (label, layout `card|compact`, people[]: name, title ES/EN, email, phone, photo) | `executive-card`, `officer-compact`, `contact-card` (adds phone, tel link) | `BoardOfDirectors`, `ScholarshipContacts` |
| 8 | **TierTable** | get-involved | header, tiers[] (name, price, accent, featured, perks[], CTA), footer contact note | `featured` highlight; neutral/secondary/primary/accent | `SponsorshipTiers` |
| 9 | **CTABanner** | about, get-involved, scholarships, home (register band) | heading, sub, buttons[1-2] (label, link, style), icon, background, `showIfRegistrationOpen` | `neutral` (about), `white` (get-involved, scholarships), `primary + icon` (home) | `AboutCTA`, `GetInvolvedCTA`, `ScholarshipCTA`, `RegisterInfoSection` |
| 10 | **Checklist** | scholarships | header, items[] (title, body), optional numbering | one use; fits CardGrid if numbering dropped | `EligibilityRequirements` |

**One-offs that do not fit a block**

- `ScholarshipCard` is a program-announcement card: banner, stat strip, notice, in-memory note, essay quote, deadline-driven status pill. Model as a `scholarship` **document type** (amount, recipients, deadline as a date, semester, essay prompt, status computed) referenced by a thin block.
- `ContactInfo` and `ContactMap` are CONFIG-driven. These should read from a `siteSettings` singleton, not be authored per page.
- `UpcomingEvents` (home) and the events directory are code-owned feeds. In Sanity they are placeholders (`eventsFeed` block with `limit` only).
- Forms (`ContactForm`, `RegisterInfoForm`, `RsvpPanel`) and `RegistrationClosed` stay in code. Labels may later be exposed through a UI dictionary document, not blocks.
- Hero-with-accent-word (`Hero.tsx:70-81`) hardcodes the highlighted words `Hope`/`Esperanza`. Needs a rich-text emphasis mark or a separate "highlight" field.

**Singletons and documents that fall out of this**

- `siteSettings`: org name (EN/ES), tagline, phone, info email, Facebook URL, hours, location label, map embed, nav, footer links, `registrationOpen` display text.
- `person` documents (board, coordinators, founder, hall of fame) referenced by PeopleGrid, FeaturedPerson and TextWithAside.
- `resourceEntry` documents (or inline arrays) with a `lastVerified` date.
- `sponsorshipTier`, `scholarship`, plus `pageSeo` (title, description, ogTitle, ogDescription, ogImage per locale).
- **Not CMS:** `consent` text (versioned and immutable), email templates, event data.

---

## 5. PEOPLE, SPONSORS, IMAGES

### 5.1 People (all hardcoded)

| Name | Title / role | Where shown | Photo | Bio | Source |
|---|---|---|---|---|---|
| Lou Anne Fetters | Founder & Visionary / Fundadora y Visionaria; "Past President" badge | About: story credit, spotlight, hall of fame; metadata description; sources in `scholarships` none | none, initials "LF" (`FounderSpotlight.tsx:40`) | ~70-word body + quote (`T:aboutPage.ts:58-66`) | `T:aboutPage.ts` || Teresita Fernandez de Robles | Vice President / Vicepresidenta | About (executive card); Scholarships (coordinator, with phone) | none, initials | none | `T:aboutPage.ts:17-20`; `T:scholarshipsPage.ts:136-140,149-153` |
| Angelica Aguiña | Officer (no title) | About | none | none | `T:aboutPage.ts:24` |
| Yuliana L. Serna Salas | Officer | About | none | none | `:25` |
| Angelica Arellano | Officer | About | none | none | `:26` |
| Maria Barba O. | Officer | About | none | none | `:27` |
| Michael Ramos | Officer | About | none | none | `:28` |
| Tina Terrazas | Officer | About | none | none | `:29` |
| Esther Yu | Officer | About | none | none | `:30` |
| Selene I. Ruiz Carbajal | Officer | About | none | none | `:31` |
| Rich Lopez | Advisor / Asesor | About (duplicated per locale) | none | none | `:43,52` |
| Rosamaria Coles | Past president (hall of fame) | About | none | none | `:96` |
| Felix Garcia | Past president | About | none | none | `:97` |
| Yolanda Ortiz | Past president | About | none | none | `:98` |
| Jesus M. Terrazas | In-memory honoree | Scholarship card and metadata | none | one sentence | `T:scholarshipsPage.ts:18-21` |
| Luis Ostos | In-memory honoree | same | none | one sentence | same |
| Stephen Christmas | Historical, referenced in hemophilia B fact | Resources | n/a | n/a | `T:resourcesPage.ts` |

**Testimonials:** none. **Staff:** none listed (the only "office" reference is hours in `contactPage.ts:73`). **Executive roles:** only Vice President is listed. President, Secretary and Treasurer are not named on the public page, although `BoardRole` has them **[inferred]**.

Observed issue: all 10 board, executive and advisor emails are `@gmail.com` addresses, most with `.hoep` in the local part (`aboutPage.ts:20-31,43`). These are published in the client bundle, so any Sanity migration publishes them from CMS data. Consider a role mailbox instead (see `BoardManagementClient.tsx:92-98`, `mailbox("president")` and so on).

### 5.2 Sponsors and partners

- **No sponsor names or logos appear anywhere on the public site.** Only tier definitions (`T:getInvolvedPage.ts:175-241`) and an "All sponsors receive recognition" sentence. The "Logo on HOEP website" perk (Gold) has no corresponding surface. The sponsors feature was cut (`cut/sponsors`, RESTORE.md:61).
- Partners and references (text and link only, no logos):
  - National: NHF, HFA, CDC, NBDF (`T:resourcesPage.ts:119-152`).
  - Local: UMC El Paso, TTHSC El Paso, El Paso Children's Hospital (`:199-229`).
  - Programs: Camp Bold Eagle, NHF Youth Programs (`:~265-300`).
  - Insurance: HFA, NHF.

### 5.3 Static images

| Path | Used in | Alt text (EN / ES) |
|---|---|---|
| `public/logo.png` | `C:layout/Navbar.tsx:51`, `Footer.tsx:23`, `PortalFooter.tsx:25`, `PortalNavBar.tsx:42`, `AdminMobileNav.tsx:32` (the last 3 are portal/admin chrome); `OrganizationSchema.tsx:9` (JSON-LD logo) | "Hemophilia Outreach of El Paso" in both. **EN only in ES** (not localized) |
| `src/app/opengraph-image.png` | Next metadata file convention (served automatically) **[inferred]** | none (no alt) |
| `src/app/apple-icon.png`, `src/favicon.ico` | Next file conventions | n/a |
| `/images/og-default.jpg`, `og-about.jpg`, `og-contact.jpg`, `og-events.jpg`, `og-get-involved.jpg`, `og-resources.jpg`, `og-scholarships.jpg` | OG/Twitter tags in the layouts | alt in OG tags is present: "HOEP Logo", "HOEP Team" etc. (EN/ES for about). **Files do not exist**; see 0.3 |
| `/og-default.jpg` | `EventSchema.tsx:38` fallback | none |
| `/api/checkin-qr/{token}` (dynamic) | `C:rsvp/RsvpPanel.tsx:144` | `alt="QR"` (EN only, not descriptive) |
| Event flyers (R2 uploads, `flyerEnUrl`/`flyerEsUrl`) | `C:events/FlyerPreview.tsx` | iframe `title="Flyer Preview"` (EN only) |
| Recap photo gallery (external embed URL) | recap page | `title` EN/ES |
| Map (Google embed) | `ContactMap.tsx:27` | `title="El Paso, Texas"` (EN only) |

**There are no photographs anywhere on the public site.** All imagery is the logo, gradients, emoji and Lucide icons. Emoji used as content: 🎯 ⭐ 🏆 (`aboutPage.ts:126,131,136`), 🏛️ (`FounderStory.tsx:74`), 🕊️ and ✍️ (`ScholarshipCard.tsx`), plus ★ in a string (`getInvolvedPage.ts:173`).

---

## 6. CONFIG DUPLICATION

### 6.1 Phone `(915) 621-8291`: **32 literal occurrences, 10 files, 5 formats**

| File | Count | Format |
|---|---|---|
| `T:rsvpPage.ts` | 8 (lines 4,24,26,27,34,54,56,57) | `915-621-8291` inside sentences |
| `C:events/event-page/EventPageContent.tsx` | 8 (lines 197-198, 204-205, 207-208, 213-214) | `915-621-8291` inside sentences |
| `T:registerInfoPage.ts` | 4 (lines 32,33,81,82) | `915-621-8291` inside sentences |
| `C:layout/Footer.tsx` | 2 (71 `tel:9156218291`, 74 `(915) 621-8291`) | two formats |
| `C:layout/PortalFooter.tsx` | 2 (73,76) | same as Footer (portal chrome) |
| `C:contact/ContactInfo.tsx` | 2 (27 `(915) 621-8291`, 28 `tel:+19156218291`) | two formats |
| `T:scholarshipsPage.ts` | 2 (139,152) | `(915) 621-8291` |
| `M:RsvpEmail.tsx` | 2 (48,62) | `915-621-8291` |
| `src/components/seo/OrganizationSchema.tsx` | 1 (21) | `+1-915-621-8291` |
| `src/lib/rsvp/window.ts` | 1 (17) `CALL_US_PHONE` | the only named constant; used by `RegistrationClosed.tsx` only |

Formats: `915-621-8291`, `(915) 621-8291`, `tel:9156218291`, `tel:+19156218291`, `+1-915-621-8291`. Docs also mention it (`docs/overhaul/CUTOVER.md:112`, `RESTORE.md:96`), not counted.
Of the 32, **20 sit inside translated sentences** (rsvpPage, registerInfoPage, EventPageContent), which is the awkward kind because the number is part of a localized string.

### 6.2 Emails

- Derived from env via `contactEmail()` (`info@<domain>`): used in `Footer`, `PortalFooter`, `ContactInfo`, `SponsorshipTiers`, `unsubscribe/page.tsx`, `OrganizationSchema`, `RsvpEmail`, `RegistrationInfoConfirmation`, `CheckInConfirmation`, `BoardRoleAssigned`, `api/contact/route.ts` (3 uses), `lib/contact-routing.ts`, `lib/email/send.ts`. **13 files; 9 on public surfaces.**
- `mailbox("events")`: `EventCancelled.tsx:120`; `mailbox("noreply")`: contact route, `lib/email-service.ts`, `lib/board/assign.ts`.
- **Literal** board emails: 10 distinct addresses (1 executive, 8 officers, 1 advisor), all `@gmail.com`. They occupy 13 literal occurrences: `aboutPage.ts` (9 in the shared export, 2 for the advisor in the EN and ES blocks) plus the executive's address repeated in `scholarshipsPage.ts:138,151`.
- Domain split: site `hemoelpaso.org` (comment, `site.ts:5`) vs mail default `hemo-el-paso.org` (`site.ts:28`).

### 6.3 Facebook: **4 occurrences, 3 different URLs, 4 files**

| File | URL |
|---|---|
| `C:layout/Footer.tsx:92` | `https://www.facebook.com/4HOEP` |
| `C:layout/PortalFooter.tsx:94` | `https://www.facebook.com/4HOEP` |
| `C:contact/ContactInfo.tsx:55,67` | `https://facebook.com/hemoelpaso`, display "@hemoelpaso" |
| `src/components/seo/OrganizationSchema.tsx:27` | `https://facebook.com/HOEPElPaso` with comment `// Update with real links` |

At most one of these is correct.

### 6.4 Mailing / physical address

- **None.** Public site shows only "El Paso, Texas": `contactPage.ts:74,85`, `ContactMap.tsx:34,47` (+ maps URL `q=El+Paso+Texas` at `:49`), `OrganizationSchema.tsx:15-17,31`, `EventSchema.tsx:33-35` (hardcoded locality), `BoardRoleAssigned.tsx:116`. **6 files.**
- Third-party addresses (providers) appear in `resourcesPage.ts` (3 × 2 locales = 6).
- `lib/placeholder-events.ts:14,35,56` carries sample addresses (not public).

### 6.5 Org name

- "Hemophilia Outreach of El Paso": **56 occurrences**; "Hemophilia Outreach de El Paso" (ES): **6**. Total 62 across **26 files**, 23 of them on public or email surfaces. Heaviest: `A:layout.tsx` (9), `T:aboutPage.ts` (6), `M:BoardRoleAssigned.tsx` (3), six per-page layouts (3 each).
- Split wordmark ("Hemophilia Outreach" / "of El Paso") is hardcoded in `Navbar.tsx:59-62` and `Footer.tsx:31-34`.
- Abbreviation "HOEP" appears in perhaps 60+ places (not counted; for example `<title>` templates, email sign-offs, consent text).
- `lib/site.ts` is the stated "single source" for the domain (`site.ts:1-4`) but not for phone, social, org name or address.

---

## 7. SUMMARY

### 7.1 Totals by classification

Method: leaf string literals in the EN blocks of the 10 public dictionaries in `src/translation/` (**502 EN / 502 ES**, counted by a regex pass, so approximate) plus hand-counted inline and metadata strings. Classification is a judgment pass. Treat figures as **±10%** **[inferred]**.

| Class | Dictionary strings (EN) | Inline / metadata / other (EN) | Total (EN) | Notes |
|---|---|---|---|---|
| CONTENT | ≈ 300 | ≈ 95 | **≈ 395** | dictionaries: resources ≈ 85, about ≈ 46, get-involved (live) ≈ 55, scholarships ≈ 32, home ≈ 17. Inline: page metadata ≈ 35 EN strings (8 layouts × 4), emails ≈ 25, About inline card, JSON-LD |
| UI | ≈ 170 | ≈ 100 | **≈ 270** | includes ≈ 35 dead volunteer-form strings, rsvp panel 30, register-info 40, events chrome 60+, inline mini-dicts |
| LEGAL | 0 | 4 EN strings + 3 consent labels | **≈ 7** | `consent.ts` (2 EN bodies), "Consent / I agree" labels, diagnosis prompt and hint |
| CONFIG | ≈ 12 | ≈ 40 | **≈ 50** | phone ×32 literal, FB ×4, emails, org name ×62, hours, locations |
| Non-text tokens (icon keys, colour tokens, emoji, classNames) | ≈ 35 | n/a | ≈ 35 | excluded from the totals above |

### 7.2 ES coverage

- **Dictionaries:** 502 / 502 keys have ES (**100% key parity**).
- **CONTENT strings:** ES exists for all on-site CONTENT (**≈ 100% presence, ≈ 370 of ≈ 370**). The only CONTENT without ES is the 3 EN-only email templates (≈ 25 strings, included in the ≈ 395 above), so **≈ 94% presence** (≈ 370 of ≈ 395) if emails are included.
- **Equivalence:** 6 known substantive differences (see 1.13), so **≈ 98% faithful** on-site CONTENT.
- **UI:** EN-only on about 12 strings (unsubscribe page, aria labels, alt, map titles), so ES presence on UI ≈ 95%.
- **Register inconsistency:** ES mixes tú (home hero "No estás solo", about CTA "para ti", footer, register-info, RSVP) and usted (get-involved, contact, resources, scholarships). Needs an editorial decision. Per-section or per-page register is a Sanity field-level concern: choose one before translating schemas.

### 7.3 Top 10 awkward things to migrate

1. **All content pages are client components with context-driven locale and locale-sibling dictionaries (`{ en: {...}, es: {...} }`).** Switching to GROQ means server fetching and a field-level localization strategy (internationalized arrays vs per-locale documents). The cookie locale also means no per-locale URLs or hreflang today.
2. **Lucide icon components, colour tokens and emoji are stored in content.** `getInvolvedPage.ts:23,31,39,47` stores *component references* in a translation file. About and Insurance store icon-key strings. Needs constrained icon and colour pickers and a mapping layer.
3. **Phone number embedded inside 20 translated sentences (and 5 formats).** Needs `{phone}` token interpolation from `siteSettings`; sentences stay in code, the value moves.
4. **The board is hardcoded in the client bundle while `BoardRole` in the DB assigns the same officers.** Two sources of truth; the page shows a "2025" heading and 9 personal Gmail addresses, and the public page lacks President, Secretary and Treasurer. Decide whether public people derive from the DB or Sanity.
5. **Date-sensitive content is split across text and logic.** The scholarship deadline is a display string in the dictionary *and* `new Date("2025-11-25")` in the component; heading years; "Spring Semester 2026". Needs a structured date field and computed status. The page is already stale.
6. **Copy for cut features** (sponsor dashboards/ROI, newsletter, volunteer form, portal) and **dead dictionaries** (`volunteerFormTranslation`, `navbarNavLinksTranslation`). Decide what to keep before modelling it, or you will migrate and maintain 40+ unused strings.
7. **Micro-dictionaries scattered across components** (EventSlidePanel, FlyerPreview, BackButton, EventFilterOptions, EventPageContent ×8, recap ×6, ContactForm, Navbar, FounderStory "Year Founded", RegistrationClosed). These are UI text that officers will not edit but that currently look like content. Consolidate before the content/UI split.
8. **Legal/versioned consent text** (`content/consent.ts`, `CONSENT_TEXT_VERSION = "draft-1"`, recorded per `ConsentRecord`). Must not be a freely editable CMS field. Needs immutable versions. The text is still a literal "DRAFT — pending board approval".
9. **Inconsistent facts and wording in the same data:** "12+ years" vs 1993; 3 Facebook URLs; NHF vs NBDF; "Lou Ann/Lou Anne"; org name "of/de"; GPA clause; 4 names for the register action. Migration is a forced editorial review. Budget time for it.
10. **SEO is per-page `generateMetadata` in layouts keyed on the locale cookie**, with 7 missing OG images, no event-page metadata, hardcoded JSON-LD, and default Next 404/500 pages. Needs a `pageSeo` object, an OG-image fallback chain, and new `not-found`/`error` pages (none exist).

Also notable: recap body is plain text split on `\n` (no rich text); the hero accent-word highlight is a string comparison (`Hero.tsx:74`); the auto-reply email builds HTML by string interpolation (`api/contact/route.ts:78-103`) with unescaped `name`.

### 7.4 Recommended migration order (by page)

0. **`siteSettings` first** (org name, tagline, phone, info email, Facebook, hours, location, nav, footer). It de-duplicates the 32 phone and 62 name occurrences and fixes the three Facebook URLs at once. Also create `pageSeo` and add `not-found`/`error`.
1. **Scholarships.** Smallest page, most time-sensitive (stale today), exercises the structured date, `person`, `CTABanner` and `Checklist` pieces. Resolve the GPA wording discrepancy first.
2. **Resources.** Largest and highest editorial churn (about 100 strings, 12 entries with external links, phones and addresses). Proves `PageHero`, `EntryGrid` and `lastVerified`. Pure content, no code-owned sections.
3. **About.** Introduces `person` documents, `PeopleGrid`, `FeaturedPerson` and `TextWithAside`. Resolve board source-of-truth (DB vs CMS), the "2025" heading, and drop personal emails or adopt role mailboxes before migrating.
4. **Get Involved.** `CardGrid` and `TierTable`. Remove or rewrite the cut-feature perks and the volunteer CTAs first.
5. **Home.** `PageHero` full variant, `StatsRow`, `CTABanner`, `eventsFeed` placeholder. Fix the "12+ years" stat and the accent-word hack. Stats are a good candidate for early editing but depend on the earlier decisions.
6. **Contact.** Hero and form headings only; contact info card and map read `siteSettings`. Form chrome stays in code.
7. **Events list and detail hero text:** a few strings, mostly code. Leave in code, or expose one `eventsPage` document with title and subtitle.
8. **Leave in code:** register-info, rsvp, recap, unsubscribe, access-denied, emails, consent. Optionally extract their inline mini-dictionaries into one shared UI dictionary.
