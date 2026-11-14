import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import EmailTemplatesList from "@/components/admin/settings/EmailTemplatesList";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";

export default async function EmailTemplatesPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEmailTemplates")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;

  // Fetch all email templates
  // Rows for cut features (assistance, volunteers, family, welcome) stay in the
  // DB (dormant) but are hidden from the admin list.
  const templatesRaw = await prisma.emailTemplate.findMany({
    where: {
      type: {
        notIn: [
          "ASSISTANCE_SUBMITTED",
          "ASSISTANCE_APPROVED",
          "ASSISTANCE_DENIED",
          "DISBURSEMENT_ISSUED",
          "WELCOME_EMAIL",
          "VOLUNTEER_REQUEST_RECEIVED",
          "VOLUNTEER_REQUEST_NOTIFY",
          "VOLUNTEER_APPROVED",
          "VOLUNTEER_ASSIGNED",
          "FAMILY_MEMBER_INVITE",
          // RSVP emails are sent from code (src/lib/rsvp), not editable templates
          "RSVP_CONFIRMATION",
          "RSVP_CANCELLATION",
          "RSVP_REMINDER",
        ],
      },
    },
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
