import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import EditTemplateForm from "@/components/admin/settings/EditTemplateForm";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";

interface Props {
  params: { id: string };
}

export default async function EditTemplatePage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageEmailTemplates")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;

  const template = await prisma.emailTemplate.findUnique({
    where: { id: params.id },
  });

  if (!template) notFound();

  // Convert JsonValue to string[]
  const templateFormatted = {
    ...template,
    variables: Array.isArray(template.variables)
      ? (template.variables as string[])
      : [],
  };

  return (
    <div>
      <Link
        href="/admin/settings/email-templates"
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Email Templates
      </Link>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
          Edit Email Template
        </h2>
        <p className="text-neutral-600">{template.name}</p>
      </div>

      <EditTemplateForm template={templateFormatted} locale={locale} />
    </div>
  );
}
