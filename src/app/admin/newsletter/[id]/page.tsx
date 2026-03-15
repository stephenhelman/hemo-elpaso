import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import NewsletterDraftClient from "./NewsletterDraftClient";

interface Props {
  params: { id: string };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default async function NewsletterDraftPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewAdminDashboard")) redirect("/admin/dashboard");

  const newsletter = await prisma.newsletter.findUnique({
    where: { id: params.id },
  });

  if (!newsletter) notFound();

  const isPresident = admin.can("canApproveNewsletter");

  return (
    <NewsletterDraftClient
      newsletter={{
        id: newsletter.id,
        month: newsletter.month,
        year: newsletter.year,
        monthName: MONTH_NAMES[newsletter.month - 1],
        status: newsletter.status,
        revisionNotes: newsletter.revisionNotes,
        generatedContentJson: newsletter.generatedContentJson as any,
      }}
      isPresident={isPresident}
      adminEmail={admin!.email}
    />
  );
}
