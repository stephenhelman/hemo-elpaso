/**
 * EMAIL_MODE: whether an email may reach Resend. PURE (no Resend, no DB, no Next): unit-tested in scripts/check-email-guard.ts.
 *
 *   live       send via Resend. The DEFAULT only when VERCEL_ENV === "production".
 *   capture    never call Resend. The email is rendered and logged (EmailLog status "captured") and kept in an in-memory
 *              outbox (lib/email/send.ts emailOutbox); local dev also writes .email-outbox/*.html. The DEFAULT everywhere
 *              else: local dev, preview deploys and every check script.
 *   allowlist  send via Resend only to addresses in EMAIL_DEV_ALLOWLIST (comma separated, exact address or "@domain");
 *              everything else is captured. For seeing a real email in your own inbox from dev.
 *
 * Hard guard: "live" outside production THROWS (a stray env var must not turn dev or a preview into live sending), and so
 * does an unknown value. send.ts resolves the mode when it is imported and src/instrumentation.ts resolves it when the
 * server starts, so a bad setting stops the app instead of failing at the first email.
 */
export type EmailMode = "live" | "capture" | "allowlist";
type Env = Record<string, string | undefined>;

export function resolveEmailMode(env: Env): EmailMode {
  const production = env.VERCEL_ENV === "production";
  const raw = (env.EMAIL_MODE ?? "").trim().toLowerCase();
  if (raw === "") return production ? "live" : "capture";
  if (raw !== "live" && raw !== "capture" && raw !== "allowlist") {
    throw new Error(`EMAIL_MODE must be "live", "capture" or "allowlist" (got "${raw}")`);
  }
  if (raw === "live" && !production) {
    throw new Error(`EMAIL_MODE=live is only allowed when VERCEL_ENV=production (VERCEL_ENV is "${env.VERCEL_ENV ?? ""}"). Use "capture", or "allowlist" with EMAIL_DEV_ALLOWLIST.`);
  }
  return raw;
}

export const parseAllowlist = (v: string | undefined): string[] =>
  (v ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);

/** Exact address, or "@domain.org" for a whole domain. */
export function isAllowlisted(address: string, list: string[]): boolean {
  const a = address.trim().toLowerCase();
  const m = /<([^>]+)>/.exec(a); // "Name <x@y>" -> x@y
  const bare = m ? m[1] : a;
  return list.some((e) => (e.startsWith("@") ? bare.endsWith(e) : bare === e));
}

export function splitByAllowlist(to: string | string[], list: string[]): { send: string[]; capture: string[] } {
  const all = Array.isArray(to) ? to : [to];
  return { send: all.filter((a) => isAllowlisted(a, list)), capture: all.filter((a) => !isAllowlisted(a, list)) };
}
