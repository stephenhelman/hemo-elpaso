import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import EmailTemplatesList from "@/components/admin/settings/EmailTemplatesList";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";

export default async function EmailTemplatesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

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
