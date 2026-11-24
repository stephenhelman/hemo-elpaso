import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/identity/session";
import { getAdminWithPermissions, type Permission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * Used by middleware.ts (Edge, no Prisma) to ask "may THIS session open this area?". Reports only on the caller's own
 * session and returns an empty body. Always 200 / 401 / 403; on 403 the `x-hoep-mode` header says what the session is
 * (board | family | none) so middleware can send it to the right place. No data is exposed.
 *
 *   ?need=board   board mode (an org Google account of an admin / board-role holder). Optional ?perm=<permission>.
 *   ?need=portal  a linked person with a household (family or board mode).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const need = url.searchParams.get("need");
  const s = await resolveSession();
  if (!s) return new NextResponse(null, { status: 401 });

  const deny = () => new NextResponse(null, { status: 403, headers: { "x-hoep-mode": s.mode, "x-hoep-household": s.hasHousehold ? "1" : "0" } });

  if (need === "portal") return s.mode !== "none" && s.hasHousehold ? new NextResponse(null, { status: 200 }) : deny();
  if (need !== "board") return new NextResponse(null, { status: 400 });

  if (s.mode !== "board") return deny();
  const perm = url.searchParams.get("perm");
  if (perm) {
    const admin = await getAdminWithPermissions();
    if (!admin || !admin.can(perm as Permission)) return deny();
  }
  return new NextResponse(null, { status: 200 });
}
