/**
 * "Sign in with a different account". A user with no app session would skip the Auth0 logout and the Auth0 SSO +
 * provider sessions would survive (and "login" would silently sign them straight back into the same account). So go
 * to Auth0's own /v2/logout directly, then return to /api/auth/login with prompt=login so Auth0 re-authenticates.
 * Built server-side from env vars. The returnTo URL must be listed in Auth0 "Allowed Logout URLs".
 */
export function switchAccountHref(returnToPath: string): string {
  const issuer = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const base = process.env.AUTH0_BASE_URL;
  if (!issuer || !clientId || !base) return "/api/auth/logout"; // best effort if env is incomplete
  const host = new URL(issuer).host;
  const returnTo = `${base.replace(/\/$/, "")}/api/auth/login?returnTo=${encodeURIComponent(returnToPath)}&prompt=login`;
  return `https://${host}/v2/logout?client_id=${encodeURIComponent(clientId)}&returnTo=${encodeURIComponent(returnTo)}`;
}
