import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import EmailTemplatesList from "@/components/admin/settings/EmailTemplatesList";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";

export default async function EmailTemplatesPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageEmailTemplates")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;

  // Fetch all email templates
  const templatesRaw = await prisma.emailTemplate.findMany({
    orderBy: {
      type: "asc",
    },
  });

  // Convert JsonValue to string[] for the component
  const templates = templatesRaw.map((template) => ({
    ...template,
    variables: Array.isArray(template.variables)
      ? (template.variables as string[])
      : [],
  }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Email Notification Templates
        </h2>
        <p className="text-neutral-600">
          Manage automated email notifications sent to patients. Toggle
          templates on/off and customize subject lines.
        </p>
      </div>

      <EmailTemplatesList templates={templates} adminEmail={admin.email} locale={locale} />
    </div>
  );
}
