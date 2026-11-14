/**
 * Cloudflare Turnstile server-side verification.
 * Env: TURNSTILE_SITE_KEY (public, passed to the form by the server page),
 *      TURNSTILE_SECRET_KEY (server only).
 * In production a missing secret fails closed. In development with no secret
 * configured, verification is skipped so the form can be tested locally.
 */
export async function verifyTurnstile(token: unknown): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return true;
    console.error("TURNSTILE_SECRET_KEY is not set; rejecting submission");
    return false;
  }
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
