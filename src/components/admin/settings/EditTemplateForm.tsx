"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Eye } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

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
}

export default function EditTemplateForm({ template }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState(template.subject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Subject line cannot be empty");
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
        toast.success("Template updated successfully!");
        router.push("/admin/settings/email-templates");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update template");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
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
          Template Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700 font-medium">Template Type</p>
            <p className="text-blue-900">{template.type}</p>
          </div>
          <div>
            <p className="text-blue-700 font-medium">Status</p>
            <p className="text-blue-900">
              {template.enabled ? "Enabled" : "Disabled"}
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
          Email Subject Line
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Subject *
          </label>
          <input
            id="subject-input"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
            placeholder="Enter subject line..."
          />
          <p className="text-xs text-neutral-500 mt-2">
            Use variables like{" "}
            <code className="px-1 py-0.5 bg-neutral-100 rounded">
              {"{{patientName}}"}
            </code>{" "}
            to personalize emails
          </p>
        </div>

        {/* Preview */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-4">
          <p className="text-xs font-medium text-neutral-600 mb-2">PREVIEW</p>
          <p className="text-neutral-900">
            {subject || "Subject line will appear here..."}
          </p>
        </div>

        {/* Available Variables */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-3">
            Available Variables (click to insert)
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
          📧 Email Body Template
        </h3>
        <p className="text-sm text-amber-800">
          The email body design is managed through React Email components in the
          codebase. Only the subject line can be customized here. To modify the
          email body layout, contact your developer.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Link
          href="/admin/settings/email-templates"
          className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </Link>

        <Link
          href={`/admin/settings/email-templates/${template.id}/preview`}
          className="flex items-center gap-2 px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
