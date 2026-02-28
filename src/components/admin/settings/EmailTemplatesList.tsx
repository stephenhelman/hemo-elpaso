"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Edit, Power } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { adminEmailTemplatesListTranslation } from "@/translation/adminSettings";
import type { Lang } from "@/types";

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  description: string | null;
  enabled: boolean;
  variables: string[];
}

interface Props {
  templates: EmailTemplate[];
  adminEmail: string;
  locale: Lang;
}

export default function EmailTemplatesList({ templates, adminEmail, locale }: Props) {
  const router = useRouter();
  const t = adminEmailTemplatesListTranslation[locale];
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (templateId: string, currentEnabled: boolean) => {
    setToggling(templateId);

    try {
      const response = await fetch(
        `/api/admin/settings/email-templates/${templateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: !currentEnabled,
          }),
        },
      );

      if (response.ok) {
        toast.success(
          currentEnabled ? t.templateDisabled : t.templateEnabled,
        );
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || t.errorUpdate);
      }
    } catch (error: any) {
      toast.error(error.message || t.errorUpdate);
    } finally {
      setToggling(null);
    }
  };

  const getCategoryIcon = (type: string) => {
    if (type.includes("RSVP") || type.includes("EVENT")) return "📅";
    if (type.includes("CHECK_IN")) return "✅";
    if (type.includes("ASSISTANCE") || type.includes("DISBURSEMENT"))
      return "💰";
    if (type.includes("WELCOME")) return "👋";
    return "📧";
  };

  // Group templates by category
  const eventTemplates = templates.filter(
    (tmpl) =>
      tmpl.type.includes("RSVP") ||
      tmpl.type.includes("EVENT") ||
      tmpl.type.includes("CHECK_IN"),
  );
  const assistanceTemplates = templates.filter(
    (tmpl) => tmpl.type.includes("ASSISTANCE") || tmpl.type.includes("DISBURSEMENT"),
  );
  const otherTemplates = templates.filter(
    (tmpl) =>
      !tmpl.type.includes("RSVP") &&
      !tmpl.type.includes("EVENT") &&
      !tmpl.type.includes("CHECK_IN") &&
      !tmpl.type.includes("ASSISTANCE") &&
      !tmpl.type.includes("DISBURSEMENT"),
  );

  return (
    <div className="space-y-6">
      {/* Event Templates */}
      <TemplateCategory
        title={t.categories.event.title}
        description={t.categories.event.description}
        templates={eventTemplates}
        toggling={toggling}
        onToggle={handleToggle}
        getCategoryIcon={getCategoryIcon}
        t={t}
      />

      {/* Assistance Templates */}
      <TemplateCategory
        title={t.categories.assistance.title}
        description={t.categories.assistance.description}
        templates={assistanceTemplates}
        toggling={toggling}
        onToggle={handleToggle}
        getCategoryIcon={getCategoryIcon}
        t={t}
      />

      {/* Other Templates */}
      <TemplateCategory
        title={t.categories.other.title}
        description={t.categories.other.description}
        templates={otherTemplates}
        toggling={toggling}
        onToggle={handleToggle}
        getCategoryIcon={getCategoryIcon}
        t={t}
      />
    </div>
  );
}

function TemplateCategory({
  title,
  description,
  templates,
  toggling,
  onToggle,
  getCategoryIcon,
  t,
}: {
  title: string;
  description: string;
  templates: EmailTemplate[];
  toggling: string | null;
  onToggle: (id: string, enabled: boolean) => void;
  getCategoryIcon: (type: string) => string;
  t: typeof adminEmailTemplatesListTranslation["en"];
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">{title}</h3>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>

      <div className="divide-y divide-neutral-200">
        {templates.map((template) => (
          <TemplateRow
            key={template.id}
            template={template}
            toggling={toggling}
            onToggle={onToggle}
            getCategoryIcon={getCategoryIcon}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateRow({
  template,
  toggling,
  onToggle,
  getCategoryIcon,
  t,
}: {
  template: EmailTemplate;
  toggling: string | null;
  onToggle: (id: string, enabled: boolean) => void;
  getCategoryIcon: (type: string) => string;
  t: typeof adminEmailTemplatesListTranslation["en"];
}) {
  return (
    <div className="p-4 md:p-6 hover:bg-neutral-50 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 text-2xl">
            {getCategoryIcon(template.type)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-semibold text-neutral-900">
                {template.name}
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  template.enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {template.enabled ? t.enabled : t.disabled}
              </span>
            </div>

            {template.description && (
              <p className="text-sm text-neutral-600 mb-2">
                {template.description}
              </p>
            )}

            <p className="text-sm text-neutral-500 mb-2">
              <strong>{t.subject}</strong> {template.subject}
            </p>

            {/* Variables */}
            <div className="flex flex-wrap gap-1">
              {template.variables.slice(0, 5).map((variable) => (
                <span
                  key={variable}
                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-mono"
                >
                  {`{{${variable}}}`}
                </span>
              ))}
              {template.variables.length > 5 && (
                <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 text-xs">
                  {t.more(template.variables.length - 5)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
          <Link
            href={`/admin/settings/email-templates/${template.id}`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-5 h-5" />
          </Link>

          <Link
            href={`/admin/settings/email-templates/${template.id}/preview`}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Eye className="w-5 h-5" />
          </Link>

          <button
            onClick={() => onToggle(template.id, template.enabled)}
            disabled={toggling === template.id}
            className={`p-2 rounded-lg transition-colors ${
              template.enabled
                ? "text-green-600 hover:bg-green-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
