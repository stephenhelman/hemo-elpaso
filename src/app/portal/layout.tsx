import { getSession } from "@auth0/nextjs-auth0";
import { getLocaleCookie } from "@/lib/locale";
import { redirect } from "next/navigation";
import PortalSidebar from "@/components/portal/PortalSidebar";
import { prisma } from "@/lib/db";
import { ensurePatientExists } from "@/lib/ensure-patient";
import { Lang } from "@/types";
import { PortalLayout as Portal } from "@/components/layout/PortalLayout";
import { inter, poppins } from "@/lib/fonts";
import "@/app/globals.css";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const locale = (await getLocaleCookie()) as Lang;

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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <div className="min-h-screen bg-neutral-50 flex">
          <PortalSidebar
            user={{
              ...session.user,
              role: patient?.role || "patient",
            }}
            locale={locale as Lang}
          />
          <main className="flex-1 min-w-0 lg:ml-64">
            <Portal locale={locale as Lang}>
              {children}
            </Portal>
          </main>
        </div>
      </body>
    </html>
  );
}
