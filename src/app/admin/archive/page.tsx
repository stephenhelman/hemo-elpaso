import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import AdminArchiveClient from "./AdminArchiveClient";

export default async function AdminArchivePage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewFinancials")) redirect("/admin/dashboard");

  const isTreasurer = admin.can("canManageFinancials");

  const [scholarships, annualReports, taxFilings] = await Promise.all([
    prisma.scholarship.findMany({ orderBy: { awardedAt: "desc" } }),
    prisma.annualReport.findMany({ orderBy: { year: "desc" } }),
    prisma.taxFiling.findMany({ orderBy: { year: "desc" } }),
  ]);

  return (
    <AdminArchiveClient
      scholarships={scholarships.map((s) => ({
        id: s.id,
        recipientName: s.recipientName,
        amount: Number(s.amount),
        academicYear: s.academicYear,
        description: s.description,
        awardedAt: s.awardedAt.toISOString(),
      }))}
      annualReports={annualReports.map((r) => ({
        id: r.id,
        year: r.year,
        totalEventsHeld: r.totalEventsHeld,
        totalAttendance: r.totalAttendance,
        totalAssistancePaid: Number(r.totalAssistancePaid),
        totalScholarshipsPaid: Number(r.totalScholarshipsPaid),
        totalSponsorIncome: r.totalSponsorIncome
          ? Number(r.totalSponsorIncome)
          : null,
        notes: r.notes,
      }))}
      taxFilings={taxFilings.map((f) => ({
        id: f.id,
        year: f.year,
        fileUrl: f.fileUrl,
        uploadedBy: f.uploadedBy,
        createdAt: f.createdAt.toISOString(),
      }))}
      isTreasurer={isTreasurer}
    />
  );
}
