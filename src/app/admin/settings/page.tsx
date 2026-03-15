import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { Building2 } from "lucide-react";

export default async function GeneralSettingsPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewAdminDashboard")) redirect("/admin/dashboard");

  return (
    <div>
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Organization Information
        </h2>

        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600 mb-2">General settings coming soon</p>
          <p className="text-sm text-neutral-500">
            Configure organization name, logo, contact information, and more
          </p>
        </div>
      </div>
    </div>
  );
}
