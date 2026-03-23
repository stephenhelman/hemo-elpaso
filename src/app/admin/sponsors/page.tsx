import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import SponsorsClient from "./SponsorsClient";

export default async function AdminSponsorsPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");

  const sponsors = await prisma.sponsor.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    include: { _count: { select: { events: true } } },
  });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-1">Sponsors</h1>
        <p className="text-neutral-500">Manage sponsor records and logos.</p>
      </div>
      <SponsorsClient initialSponsors={sponsors} />
    </div>
  );
}
