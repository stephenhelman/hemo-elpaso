/**
 * 308 redirects for the OLD hemoelpaso.org site (Webs On The Fly / GoHighLevel), so old links, bookmarks, search
 * results and printed material land on the closest new page. Source list: the old-site archive
 * (data/links.csv: the current suffixed URLs; wayback/index.md: the pre-2025 plain URLs).
 *
 * Rules:
 *  - Only paths that are NOT real routes of the new app. The unsuffixed /get-involved, /resources and /scholarships
 *    of the old site are real new routes (same names), so they are deliberately absent: they already work.
 *    scripts/check-legacy-redirects.ts fails if a source ever collides with a route under src/app.
 *  - Destinations are relative: the host rules (host-redirects.mjs) run first, so www / old-domain requests take one
 *    extra hop to the apex and then land here. The query string is kept by Next.
 *  - Matching is case-insensitive and a trailing slash is normalised by Next before these run.
 */
export const LEGACY_REDIRECTS = [
  // Current old-site URLs (random numeric suffixes)
  ["/home-1104", "/"],
  ["/about-us-5023", "/about"],
  ["/resources-2315", "/resources"],
  ["/get-involved-2932", "/get-involved"],
  ["/calendar-of-events-3522", "/events"],
  ["/contact-us-6020", "/contact"],
  ["/scholarships-9537", "/scholarships"],
  // Pre-2025 URLs (Wayback)
  ["/home", "/"],
  ["/about-us", "/about"],
  ["/calendar-of-events", "/events"],
  ["/contact-us", "/contact"],
  ["/event-registration-contact-form", "/events"], // registration now happens on each event page / register-info
  ["/event-sponsorship-contact-form", "/contact"], // sponsorship inquiries use the contact form (reason: Sponsorship)
];

export const legacyRedirects = () =>
  LEGACY_REDIRECTS.map(([source, destination]) => ({ source, destination, permanent: true }));
