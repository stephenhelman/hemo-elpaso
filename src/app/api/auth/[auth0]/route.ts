import { NextRequest, NextResponse } from "next/server";
import { handleAuth, handleLogin, type HandlerError } from "@auth0/nextjs-auth0";

/**
 * Auth0 handlers with a friendlier failure mode: when the Post-Login Action
 * denies a login (error=access_denied) the SDK's callback handler throws and
 * Next returns a bare 400. Redirect those to /access-denied instead.
 */
export const GET = handleAuth({
  // ?prompt=login forces Auth0 to re-authenticate (ignore the SSO session).
  // Used by "Sign in with a different account" on /access-denied. Only the
  // whitelisted value is forwarded; nothing else from the query reaches Auth0.
  login: (req: NextRequest, ctx: { params: Record<string, string | string[]> }) => {
    const prompt = req.nextUrl.searchParams.get("prompt");
    return handleLogin(req, ctx, prompt === "login" ? { authorizationParams: { prompt: "login" } } : {});
  },
  onError(req: NextRequest, error: HandlerError) {
    const { pathname, searchParams } = req.nextUrl;
    if (!pathname.endsWith("/callback")) return; // keep default behavior

    const code = searchParams.get("error");
    const denied =
      code === "access_denied" ||
      (error.message ?? "").includes("access_denied");

    // Log without PII: no email, no query string, no error_description.
    console.error("Auth0 callback error", {
      code: code ?? "none",
      name: error.name,
      status: error.status,
    });

    const base = process.env.AUTH0_BASE_URL || req.url;
    const target = new URL("/access-denied", base);
    if (!denied) target.searchParams.set("reason", "error");
    return NextResponse.redirect(target);
  },
});
