import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import PrintButton from "./PrintButton";

export default async function VolunteerReferencePage() {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { contactProfile: true },
  });
  if (!patient) redirect("/portal/dashboard");

  const locale = (await getLocaleCookie()) as Lang;

  const profile = await prisma.volunteerProfile.findUnique({
    where: { patientId: patient.id },
    include: {
      timecards: {
        where: { checkOutTime: { not: null } },
        include: { event: { select: { titleEn: true, titleEs: true, eventDate: true } } },
        orderBy: { checkInTime: "asc" },
      },
    },
  });

  if (!profile || profile.status !== "APPROVED") redirect("/portal/volunteer");

  const totalHours = profile.timecards.reduce(
    (sum, tc) => sum + (Number(tc.totalHours) || 0),
    0,
  );
  const name = `${patient.contactProfile?.firstName} ${patient.contactProfile?.lastName}`;
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white print:shadow-none">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Volunteer Service Record</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Hemophilia Outreach of El Paso (HOEP)
        </p>
      </div>
      <p className="mb-4">
        This certifies that <strong>{name}</strong> has volunteered with HOEP.
      </p>
      <p className="mb-4">
        <strong>Total Hours:</strong> {totalHours.toFixed(2)}
      </p>
      <p className="mb-6">
        <strong>Events Served:</strong> {profile.timecards.length}
      </p>
      <table className="w-full border border-neutral-200 text-sm mb-8">
        <thead className="bg-neutral-50">
          <tr>
            <th className="text-left p-2 border-b border-neutral-200">Event</th>
            <th className="text-left p-2 border-b border-neutral-200">Date</th>
            <th className="text-left p-2 border-b border-neutral-200">Hours</th>
          </tr>
        </thead>
        <tbody>
          {profile.timecards.map((tc) => (
            <tr key={tc.id} className="border-b border-neutral-100">
              <td className="p-2">
                {locale === "es" ? tc.event.titleEs : tc.event.titleEn}
              </td>
              <td className="p-2">
                {new Date(tc.event.eventDate).toLocaleDateString("en-US")}
              </td>
              <td className="p-2">{Number(tc.totalHours).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-neutral-500">Generated on {today}</p>
      <div className="mt-8 pt-8 border-t border-neutral-200">
        <PrintButton label="Print / Save as PDF" />
      </div>
    </div>
  );
}
