import { getSession } from "@auth0/nextjs-auth0";
import { getLocaleCookie } from "@/lib/locale";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Lang } from "@/types";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { inter, poppins } from "@/lib/fonts";
import "@/app/globals.css";
import { getAdminWithPermissions } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const locale = (await getLocaleCookie()) as Lang;

  if (!session?.user) {
    redirect("/api/auth/login?returnTo=/admin/dashboard");
  }

  const admin = await getAdminWithPermissions();

  if (!admin) {
    redirect("/portal/dashboard");
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <div className="min-h-screen bg-neutral-50 flex">
          <AdminSidebar
            user={session.user}
            locale={locale}
            permissions={Array.from(admin.permissions)}
            isSuperAdmin={admin.isSuperAdmin}
          />
          <main className="flex-1 min-w-0 lg:ml-64">
            <PortalLayout locale={locale}>{children}</PortalLayout>
          </main>
        </div>
      </body>
    </html>
  );
}
