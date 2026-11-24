import type { ResolvedSession } from "./session";

/** Headers every /api/session/access answer carries, so middleware and the account menu read the same thing. */
export function accessHeaders(s: Pick<ResolvedSession, "mode" | "hasHousehold">): Record<string, string> {
  return { "x-hoep-mode": s.mode, "x-hoep-household": s.hasHousehold ? "1" : "0" };
}
