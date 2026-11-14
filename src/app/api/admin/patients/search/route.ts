import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";

/**
 * Patient lookup for event staff (invitations, manual RSVPs, check-in).
 * Returns display fields only: never diagnoses.
 */
export async function GET(req: NextRequest) {
  const { error } = await requirePermission("canManageEvents");
  if (error) return error;

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ patients: [] });
  const digits = q.replace(/\D/g, "");

  const rows = await prisma.patient.findMany({
    where: {
      ...PATIENT_ONLY,
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { contactProfile: { firstName: { contains: q, mode: "insensitive" } } },
        { contactProfile: { lastName: { contains: q, mode: "insensitive" } } },
        ...(digits.length >= 4 ? [{ contactProfile: { phone: { contains: digits } } }] : []),
      ],
    },
    include: { contactProfile: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    patients: rows.map((p) => ({
      id: p.id,
      name: `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.trim(),
      email: p.email,
      phone: p.contactProfile?.phone ?? null,
    })),
  });
}
