import { NextRequest, NextResponse } from "next/server";
import { portalContext } from "@/lib/portal/request";
import { overEditLimit, type EditResult, type PortalCtx } from "@/lib/portal/context";
import {
  acceptGuardianAttestation, addMember, convertMinor, designateGuardian, editMinor, leaveHousehold, removeMember, requestDeletion, requestEmailChange,
  revokeGuardian, setMinorDiagnoses, setOwnDiagnoses, updateAddress, updateProfile,
} from "@/lib/portal/edit";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** One entry per action the family page can take. Everything else is a 400. The household and the actor come from the session. */
const ACTIONS: Record<string, (ctx: PortalCtx, b: Body) => Promise<EditResult<Record<string, unknown>>>> = {
  profile: (c, b) => updateProfile(c, { firstName: b.firstName, lastName: b.lastName, phone: b.phone, language: b.language }),
  address: (c, b) => updateAddress(c, b.address),
  email: (c, b) => requestEmailChange(c, b.email),
  own_diagnoses: (c, b) => setOwnDiagnoses(c, b.diagnoses),
  minor_diagnoses: (c, b) => setMinorDiagnoses(c, str(b.memberId), b.diagnoses),
  add_member: (c, b) => addMember(c, (b.member ?? {}) as never),
  edit_minor: (c, b) => editMinor(c, str(b.memberId), { firstName: b.firstName, lastName: b.lastName, relationship: b.relationship, ageGroup: b.ageGroup }),
  convert_minor: (c, b) => convertMinor(c, str(b.memberId), { email: b.email, confirmByPhone: b.confirmByPhone }),
  remove_member: (c, b) => (b.confirm === true ? removeMember(c, str(b.memberId)) : Promise.resolve({ ok: false, status: 400, error: "confirm_required" })),
  leave: (c, b) => (b.confirm === true ? leaveHousehold(c) : Promise.resolve({ ok: false, status: 400, error: "confirm_required" })),
  designate_guardian: (c, b) => designateGuardian(c, str(b.childId), str(b.guardianId)),
  revoke_guardian: (c, b) => revokeGuardian(c, str(b.childId), str(b.guardianId)),
  accept_guardianship: (c) => acceptGuardianAttestation(c),
  request_deletion: (c, b) => (b.confirm === true ? requestDeletion(c) : Promise.resolve({ ok: false, status: 400, error: "confirm_required" })),
};

export async function POST(req: NextRequest) {
  const g = await portalContext(req);
  if (g.error) return g.error;
  const body = (await req.json().catch(() => null)) as Body | null;
  const run = body && typeof body.action === "string" && Object.prototype.hasOwnProperty.call(ACTIONS, body.action) ? ACTIONS[body.action] : null;
  if (!body || !run) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (await overEditLimit(g.ctx)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const r = await run(g.ctx, body);
  if (r.ok) return NextResponse.json(r);
  return NextResponse.json({ error: r.error, field: r.field }, { status: r.status });
}
