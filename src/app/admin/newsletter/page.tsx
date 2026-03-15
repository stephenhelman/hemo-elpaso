import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import NewsletterIndexClient from "./NewsletterIndexClient";

export default async function NewsletterIndexPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewAdminDashboard")) redirect("/admin/dashboard");

  const newsletters = await prisma.newsletter.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const isPresident = admin.can("canApproveNewsletter");

  return (
    <NewsletterIndexClient
      newsletters={newsletters.map((n) => ({
        id: n.id,
        month: n.month,
        year: n.year,
        status: n.status,
        sentAt: n.sentAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      }))}
      isPresident={isPresident}
    />
  );
}
