import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import AdminArchiveClient from "./AdminArchiveClient";

export default async function AdminArchivePage() {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { boardRoles: true },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const isTreasurer =
    admin.boardRoles.some((r) => r.role === "TREASURER" && r.active) ||
    admin.role === "admin";

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
