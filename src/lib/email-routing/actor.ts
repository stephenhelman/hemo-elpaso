import { prisma } from "@/lib/db";
import type { Actor } from "./change";

/** "First Last" from the contact profile, else the login email. Used in the audit entry and the officer notice. */
export async function actorFor(admin: { id: string; email: string }): Promise<Actor> {
  const p = await prisma.patient.findUnique({
    where: { id: admin.id },
    select: { contactProfile: { select: { firstName: true, lastName: true } } },
  });
  const name = p?.contactProfile ? `${p.contactProfile.firstName} ${p.contactProfile.lastName}`.trim() : "";
  return { id: admin.id, name: name || admin.email };
}
