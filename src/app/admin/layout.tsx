import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login?returnTo=/admin/dashboard");
  }

  // Check if user is board member or admin
  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!patient || !["board", "admin"].includes(patient.role)) {
    redirect("/portal/dashboard"); // Regular patients can't access admin
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <AdminSidebar user={session.user} />
      <main className="flex-1 min-w-0 lg:ml-64">{children}</main>
    </div>
  );
}
