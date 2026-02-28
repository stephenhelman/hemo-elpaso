import PortalNavbar from "./PortalNavBar";
import PortalFooter from "./PortalFooter";
import { Lang } from "@/types";
import { UserProvider } from "@auth0/nextjs-auth0/client";

export async function PortalLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Lang;
}) {
  return (
    <UserProvider>
      <div className="overflow-x-hidden">
        <PortalNavbar locale={locale} />
        {children}
        <PortalFooter locale={locale} />
      </div>
    </UserProvider>
  );
}
