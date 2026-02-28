"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Eye } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { adminEditTemplateTranslation } from "@/translation/adminSettings";
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
  template: EmailTemplate;
  locale: Lang;
}

export default function EditTemplateForm({ template, locale }: Props) {
  const router = useRouter();
  const t = adminEditTemplateTranslation[locale];
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState(template.subject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error(t.errorEmpty);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/settings/email-templates/${template.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject }),
        },
      );

      if (response.ok) {
        toast.success(t.successUpdated);
        router.push("/admin/settings/email-templates");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || t.errorUpdate);
      }
    } catch (error: any) {
      toast.error(error.message || t.errorUpdate);
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    const input = document.getElementById("subject-input") as HTMLInputElement;
    if (input) {
      const start = input.selectionStart || subject.length;
      const end = input.selectionEnd || subject.length;
      const newSubject =
        subject.substring(0, start) +
        `{{${variable}}}` +
        subject.substring(end);
      setSubject(newSubject);

      // Focus back on input
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(
          start + variable.length + 4,
          start + variable.length + 4,
        );
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          {t.templateInfo}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700 font-medium">{t.templateType}</p>
            <p className="text-blue-900">{template.type}</p>
          </div>
          <div>
            <p className="text-blue-700 font-medium">{t.status}</p>
            <p className="text-blue-900">
              {template.enabled ? t.enabled : t.disabled}
            </p>
          </div>
        </div>
        {template.description && (
          <p className="text-sm text-blue-800 mt-3">{template.description}</p>
        )}
      </div>

      {/* Subject Line Editor */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          {t.subjectLineSection}
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t.subjectLabel}
          </label>
          <input
            id="subject-input"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
            placeholder={t.subjectPlaceholder}
          />
          <p className="text-xs text-neutral-500 mt-2">
            {t.subjectHint}{" "}
            <code className="px-1 py-0.5 bg-neutral-100 rounded">
              {"{{patientName}}"}
            </code>{" "}
            {t.subjectHintSuffix}
          </p>
        </div>

        {/* Preview */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-4">
          <p className="text-xs font-medium text-neutral-600 mb-2">
            {t.previewLabel}
          </p>
          <p className="text-neutral-900">
            {subject || t.previewPlaceholder}
          </p>
        </div>

        {/* Available Variables */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-3">
            {t.availableVariables}
          </p>
          <div className="flex flex-wrap gap-2">
            {template.variables.map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => insertVariable(variable)}
                className="px-3 py-1.5 rounded-lg bg-white border border-neutral-300 hover:border-primary hover:bg-primary-50 transition-colors text-sm font-mono text-neutral-700 hover:text-primary"
              >
                {`{{${variable}}}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Email Body Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-semibold text-amber-900 mb-2">
          📧 {t.bodyNoteTitle}
        </h3>
        <p className="text-sm text-amber-800">{t.bodyNoteText}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Link
          href="/admin/settings/email-templates"
          className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
        >
          {t.cancel}
        </Link>

        <Link
          href={`/admin/settings/email-templates/${template.id}/preview`}
          className="flex items-center gap-2 px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {t.preview}
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.saving}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t.saveChanges}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
