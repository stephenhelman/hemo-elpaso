import { requirePermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import VolunteersClient from "@/components/admin/VolunteersClient";

export default async function AdminVolunteersPage() {
  const { error } = await requirePermission("canManageVolunteers");
  if (error) redirect("/admin");

  const locale = (await getLocaleCookie()) as Lang;

  const volunteers = await prisma.volunteerProfile.findMany({
    include: {
      patient: { include: { contactProfile: true } },
      applications: { orderBy: { submittedAt: "desc" }, take: 1 },
      eventAssignments: {
        include: { event: { select: { id: true, titleEn: true, eventDate: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-neutral-900">Volunteers</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Manage volunteer applications and assignments
        </p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <VolunteersClient initialVolunteers={volunteers as any} locale={locale} />
    </div>
  );
}
