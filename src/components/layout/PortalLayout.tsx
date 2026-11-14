import PortalNavbar from "./PortalNavBar";
import PortalFooter from "./PortalFooter";
import { Lang } from "@/types";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { registrationOpen } from "@/lib/registration";

export async function PortalLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Lang;
}) {
  return (
    <UserProvider>
      <div className="overflow-x-clip">
        <PortalNavbar locale={locale} />
        {children}
        <PortalFooter locale={locale} registrationOpen={registrationOpen()} />
      </div>
    </UserProvider>
  );
}
