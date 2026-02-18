import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import PortalSidebar from "@/components/portal/PortalSidebar";
import { prisma } from "@/lib/db";

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
  });

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <PortalSidebar
        user={{
          ...session.user,
          role: patient?.role || "patient",
        }}
      />
      <main className="flex-1 lg:ml-64">{children}</main>
    </div>
  );
}
