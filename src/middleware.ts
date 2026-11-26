import { NextRequest, NextResponse } from "next/server";
import { initAuth0 } from "@auth0/nextjs-auth0/edge";
import { SESSION_CONFIG } from "@/lib/auth0-config";

const { getSession } = initAuth0({ session: SESSION_CONFIG });

/**
 * Gatekeeper for /admin/* and /api/admin/* (board mode) and /portal/* and /api/portal/* (a linked household).
 *
 * Who someone is comes from the database, per request, never from a cookie claim: the Auth0 `sub` maps to a linked
 * identity, and the mode (board / family / none) is derived from how they signed in (lib/identity/rules.ts). Middleware
 * runs on the Edge runtime where Prisma is unavailable, so the decision is delegated to /api/session/access (Node
 * runtime), forwarding the caller's cookies. Route handlers still run their own requirePermission() checks: this is
 * the outer layer, not a replacement.
 */
const ADMIN_PREFIXES = ["/admin", "/api/admin"];
const PORTAL_PREFIXES = ["/portal", "/api/portal"];
const under = (pathname: string, prefixes: string[]) => prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

/**
 * Links in patient emails carry ?lang=en|es. That wins over the locale cookie:
 * store it as the cookie (response) and make THIS request see it too (request
 * header), so the server render is already in the right language.
 */
function applyLangParam(req: NextRequest): NextResponse | null {
  const lang = req.nextUrl.searchParams.get("lang");
  if (lang !== "en" && lang !== "es") return null;
  req.cookies.set("locale", lang);
  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set("locale", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isAdmin = under(pathname, ADMIN_PREFIXES);
  const isPortal = under(pathname, PORTAL_PREFIXES);
  if (!isAdmin && !isPortal) return applyLangParam(req) ?? NextResponse.next();

  const isApi = pathname.startsWith("/api/");
  const res = NextResponse.next();

  const session = await getSession(req, res);
  // A flyer request refused here never reaches its route, so it has to be logged here.
  const logRefusedFlyer = (status: number) => {
    if (isApi && pathname.includes("/flyers")) console.error("[flyers] auth failed", { path: pathname, httpStatus: status });
  };

  if (!session?.user) {
    if (isApi) {
      logRefusedFlyer(401);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/api/auth/login", req.url);
    login.searchParams.set("returnTo", pathname + search);
    return NextResponse.redirect(login);
  }

  let allowed = false;
  let mode = "none";
  let household = false;
  try {
    // Site-content Studio needs more than "is board": canEditSiteContent.
    const perm =
      pathname === "/admin/studio" || pathname.startsWith("/admin/studio/") ? "&perm=canEditSiteContent" : "";
    const check = await fetch(new URL(`/api/session/access?need=${isAdmin ? "board" : "portal"}${perm}`, req.url), {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    allowed = check.ok;
    mode = check.headers.get("x-hoep-mode") ?? "none";
    household = check.headers.get("x-hoep-household") === "1";
  } catch {
    // Fail closed
    allowed = false;
  }

  if (!allowed) {
    if (isApi) {
      logRefusedFlyer(403);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // A signed-in family never sees the board side; send them to their own page. Someone we can't match is told so.
    let to = "/";
    if (mode === "none") to = "/no-household";
    else if (isAdmin && mode === "family" && household) to = "/portal";
    else if (isPortal && mode === "board") to = "/admin/dashboard";
    return NextResponse.redirect(new URL(to, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/portal/:path*",
    "/api/portal/:path*",
    // ?lang= from email links
    "/rsvp/:path*",
    "/confirm/:path*",
    "/unsubscribe",
    "/api/unsubscribe",
    "/events/:path*",
    "/contact",
    "/register-info",
    "/privacy",
    "/terms",
    "/children",
    "/legal",
  ],
};
