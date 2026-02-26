import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import PortalSidebar from "@/components/portal/PortalSidebar";
import { prisma } from "@/lib/db";
import DiagnosisReminderBanner from "@/components/portal/DiagnosisReminderBanner";
import { ensurePatientExists } from "@/lib/ensure-patient";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/api/auth/login?returnTo=/portal/dashboard");
  }

  // Ensure a Patient row exists (creates a stub for first-time Auth0 users)
  await ensurePatientExists(session.user.sub, session.user.email);

  // Get patient to check role and registration status
  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      contactProfile: true,
      disorderProfile: true,
    },
  });

  // Redirect to registration if onboarding hasn't been completed.
  // Allow through if the patient has a profile (legacy users pre-dating
  // the registrationCompletedAt field).
  if (
    !patient ||
    (!patient.registrationCompletedAt && !patient.contactProfile)
  ) {
    redirect("/register");
  }

  const needsDiagnosisLetter =
    patient.disorderProfile?.condition && // Has a bleeding disorder
    !patient.disorderProfile.diagnosisVerified && // Not verified yet
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
              hasUploadedLetter={!!patient.disorderProfile?.diagnosisLetterUrl}
              isVerified={patient.disorderProfile.diagnosisVerified}
              language={(patient.preferredLanguage as "en" | "es") || "en"}
            />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
