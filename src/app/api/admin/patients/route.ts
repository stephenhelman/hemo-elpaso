import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { sendMemberConfirmations } from "@/lib/households/confirmation";
import { createPatient, validatePatientInput } from "@/lib/patients/create";

/** Board "Add patient" for phone call-ins. Consents are recorded with method "phone". */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  const body = await req.json();
  const v = validatePatientInput(body);
  if (!v.ok) {
    return NextResponse.json({ error: "invalid", field: v.field }, { status: 400 });
  }
  // Only users who may see PHI can enter diagnoses.
  const canPHI = admin!.can("canViewPHI");
  const value = canPHI
    ? v.value
    : {
        ...v.value,
        diagnoses: [],
        members: v.value.members.map((m) => ({ ...m, statedDiagnoses: [] })),
      };

  const created = await createPatient(value, {
    source: "phone",
    method: "phone",
    recordedByBoardUserId: admin!.id,
  });
  await sendMemberConfirmations(created.id, value.firstName, value.language, created.invites);
  return NextResponse.json({ id: created.id, possibleDuplicate: !!created.duplicateOfId }, { status: 201 });
}
