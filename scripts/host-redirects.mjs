/**
 * Host redirects, used by next.config.mjs (and tested by scripts/check-host-redirects.ts).
 *
 * Why next.config redirects() and not middleware: redirects() is matched against EVERY request path before
 * middleware runs, so /admin, /api/auth/callback, /rsvp/..., anything, is covered with no list to maintain.
 * (middleware.ts only runs for the paths in its matcher, which is a short allow-list.) Query strings are carried
 * over automatically, so ?lang=es and ?token=... survive.
 *
 *   old hosts      -> 308 to the canonical site, path + query kept, EXCEPT /brand/* and /api/checkin-qr/*,
 *                     which keep being served from the old host: they are the images inside emails that were
 *                     already sent (logo, QR code) and some mail clients do not follow redirects for images.
 *   www.<canonical> -> 308 to the canonical (apex) host, everything.
 *
 * Nothing is generated unless the canonical URL is a real public host (not localhost / *.vercel.app), so dev and
 * preview builds are unaffected.
 */
export const OLD_HOSTS = ["hemo-el-paso.org", "www.hemo-el-paso.org"];
// Path prefixes still served on the old host (negative lookahead in the path-to-regexp source below).
export const KEEP_ON_OLD_HOST = ["brand/", "api/checkin-qr/"];

const esc = (h) => h.replace(/\./g, "\\.");

export function hostRedirects(canonicalUrl) {
  let canonical;
  try {
    canonical = new URL(canonicalUrl);
  } catch {
    return [];
  }
  const host = canonical.host;
  if (/^localhost|^127\.|\.vercel\.app$/.test(host) || host.startsWith("www.")) return [];
  const dest = `${canonical.origin}`;
  const rules = [];

  const old = OLD_HOSTS.filter((h) => h !== host);
  if (old.length) {
    rules.push({
      source: `/:path((?!${KEEP_ON_OLD_HOST.join("|")}).*)`,
      has: [{ type: "host", value: `(${old.map(esc).join("|")})` }],
      destination: `${dest}/:path`,
      permanent: true, // 308
    });
    // The bare "/" is not matched by the rule above ("/:path" needs a segment).
    rules.push({
      source: "/",
      has: [{ type: "host", value: `(${old.map(esc).join("|")})` }],
      destination: `${dest}/`,
      permanent: true,
    });
  }
  rules.push({
    source: "/:path*",
    has: [{ type: "host", value: esc(`www.${host}`) }],
    destination: `${dest}/:path*`,
    permanent: true,
  });
  return rules;
}
