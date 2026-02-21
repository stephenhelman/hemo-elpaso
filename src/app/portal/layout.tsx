import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import PortalSidebar from "@/components/portal/PortalSidebar";
import { prisma } from "@/lib/db";
import DiagnosisReminderBanner from "@/components/portal/DiagnosisReminderBanner";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/api/auth/login?returnTo=/portal/dashboard");
  }

  // Get patient to check role
  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      profile: true,
    },
  });

  if (!patient) {
    redirect("/api/auth/login");
  }

  const needsDiagnosisLetter =
    patient.profile?.primaryCondition && // Has a bleeding disorder
    !patient.diagnosisVerified && // Not verified yet
    patient.diagnosisGracePeriodEndsAt; // Has grace period set

  const daysRemaining =
    needsDiagnosisLetter && patient.diagnosisGracePeriodEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(patient.diagnosisGracePeriodEndsAt).getTime() -
              Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <PortalSidebar
        user={{
          ...session.user,
          role: patient?.role || "patient",
        }}
      />
      <main className="flex-1 min-w-0 lg:ml-64">
        {needsDiagnosisLetter && (
          <div className="p-4 lg:p-6">
            <DiagnosisReminderBanner
              daysRemaining={daysRemaining}
              hasUploadedLetter={!!patient.diagnosisLetterUrl}
              isVerified={patient.diagnosisVerified}
              language={(patient.preferredLanguage as "en" | "es") || "en"}
            />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
