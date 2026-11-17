import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0/edge";

/**
 * Gatekeeper for /admin/* and /api/admin/*.
 *
 * Requires an Auth0 session whose Patient record has role "board" or "admin".
 * Middleware runs on the Edge runtime where Prisma is unavailable, so the role
 * check is delegated to /api/session/board-check (Node runtime), forwarding
 * the caller's cookies. Route handlers still run their own requirePermission()
 * checks — this is the outer layer, not a replacement.
 */
const ADMIN_PREFIXES = ["/admin", "/api/admin"];

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
  if (!ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return applyLangParam(req) ?? NextResponse.next();
  }
  const isApi = pathname.startsWith("/api/");
  const res = NextResponse.next();

  const session = await getSession(req, res);

  if (!session?.user) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/api/auth/login", req.url);
    login.searchParams.set("returnTo", pathname + search);
    return NextResponse.redirect(login);
  }

  let isBoard = false;
  try {
    // Site-content Studio needs more than "is board": canEditSiteContent.
    const needsPerm =
      pathname === "/admin/studio" || pathname.startsWith("/admin/studio/")
        ? "?perm=canEditSiteContent"
        : "";
    const check = await fetch(new URL(`/api/session/board-check${needsPerm}`, req.url), {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    isBoard = check.ok;
  } catch {
    // Fail closed
    isBoard = false;
  }

  if (!isBoard) {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    // ?lang= from email links
    "/rsvp/:path*",
    "/confirm/:path*",
    "/unsubscribe",
    "/api/unsubscribe",
    "/events/:path*",
    "/contact",
    "/register-info",
  ],
};
