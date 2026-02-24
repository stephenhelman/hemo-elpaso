"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const categoryOptions = [
  { value: "EDUCATION", label: "Educational Seminar" },
  { value: "SOCIAL", label: "Social Event" },
  { value: "FUNDRAISING", label: "Fundraising" },
  { value: "ADVOCACY", label: "Advocacy" },
  { value: "YOUTH", label: "Youth Program" },
  { value: "FAMILY_SUPPORT", label: "Family Support" },
  { value: "MEDICAL_UPDATE", label: "Medical Update" },
  { value: "FINANCIAL_ASSISTANCE", label: "Financial Assistance" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    titleEn: "",
    titleEs: "",
    descriptionEn: "",
    descriptionEs: "",
    slug: "",

    // Date & Location
    eventDate: "",
    eventTime: "",
    location: "",
    maxCapacity: "",
    rsvpDeadline: "",

    // Categorization
    category: "FAMILY_SUPPORT",
    targetAudience: "all",
    language: "both",
    isPriority: false,
    status: "draft",

    // Targeting
    targetConditions: [] as string[],
    targetSeverity: [] as string[],
    targetAgeGroups: [] as string[],
  });

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (titleEn: string) => {
    updateFormData({
      titleEn,
      slug: generateSlug(titleEn),
    });
  };

  const toggleArrayValue = (
    field: "targetConditions" | "targetSeverity" | "targetAgeGroups",
    value: string,
  ) => {
    const current = formData[field];
    if (current.includes(value)) {
      updateFormData({ [field]: current.filter((v) => v !== value) });
    } else {
      updateFormData({ [field]: [...current, value] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time
      const eventDateTime = new Date(
        `${formData.eventDate}T${formData.eventTime}`,
      );
      const rsvpDeadlineDate = formData.rsvpDeadline
        ? new Date(formData.rsvpDeadline)
        : null;

      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          eventDate: eventDateTime.toISOString(),
          rsvpDeadline: rsvpDeadlineDate?.toISOString(),
          maxCapacity: formData.maxCapacity
            ? parseInt(formData.maxCapacity)
            : null,
        }),
      });

      if (response.ok) {
        router.push("/admin/events");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create event");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create event",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-8">
        Create New Event
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Event Title (English)" required>
              <input
                type="text"
                required
                value={formData.titleEn}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={inputClass}
                placeholder="Spring Educational Dinner 2026"
              />
            </FormField>

            <FormField label="Event Title (Spanish)" required>
              <input
                type="text"
                required
                value={formData.titleEs}
                onChange={(e) => updateFormData({ titleEs: e.target.value })}
                className={inputClass}
                placeholder="Cena Educativa de Primavera 2026"
              />
            </FormField>
          </div>

          <FormField label="URL Slug" required>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => updateFormData({ slug: e.target.value })}
              className={inputClass}
              placeholder="spring-educational-dinner-2026"
            />
            <p className="text-xs text-neutral-500 mt-1">
              URL: hemo-el-paso.org/events/{formData.slug || "your-event-slug"}
            </p>
          </FormField>

          <FormField label="Description (English)" required>
            <textarea
              required
              rows={4}
              value={formData.descriptionEn}
              onChange={(e) =>
                updateFormData({ descriptionEn: e.target.value })
              }
              className={`${inputClass} resize-none`}
              placeholder="Detailed event description in English..."
            />
          </FormField>

          <FormField label="Description (Spanish)" required>
            <textarea
              required
              rows={4}
              value={formData.descriptionEs}
              onChange={(e) =>
                updateFormData({ descriptionEs: e.target.value })
              }
              className={`${inputClass} resize-none`}
              placeholder="Descripción detallada del evento en español..."
            />
          </FormField>
        </Section>

        {/* Date & Location */}
        <Section title="Date & Location">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Event Date" required>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => updateFormData({ eventDate: e.target.value })}
                className={inputClass}
              />
            </FormField>

            <FormField label="Event Time" required>
              <input
                type="time"
                required
                value={formData.eventTime}
                onChange={(e) => updateFormData({ eventTime: e.target.value })}
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Location" required>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => updateFormData({ location: e.target.value })}
              className={inputClass}
              placeholder="UMC El Paso Conference Center, 4815 Alameda Ave"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Max Capacity">
              <input
                type="number"
                min="1"
                value={formData.maxCapacity}
                onChange={(e) =>
                  updateFormData({ maxCapacity: e.target.value })
                }
                className={inputClass}
                placeholder="Leave blank for unlimited"
              />
            </FormField>

            <FormField label="RSVP Deadline">
              <input
                type="date"
                value={formData.rsvpDeadline}
                onChange={(e) =>
                  updateFormData({ rsvpDeadline: e.target.value })
                }
                className={inputClass}
              />
            </FormField>
          </div>
        </Section>

        {/* Categorization */}
        <Section title="Categorization">
          <FormField label="Category" required>
            <select
              required
              value={formData.category}
              onChange={(e) => updateFormData({ category: e.target.value })}
              className={inputClass}
            >
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Target Audience" required>
              <select
                required
                value={formData.targetAudience}
                onChange={(e) =>
                  updateFormData({ targetAudience: e.target.value })
                }
                className={inputClass}
              >
                <option value="all">All Ages</option>
                <option value="youth">Youth</option>
                <option value="adults">Adults</option>
                <option value="families">Families</option>
              </select>
            </FormField>

            <FormField label="Language" required>
              <select
                required
                value={formData.language}
                onChange={(e) => updateFormData({ language: e.target.value })}
                className={inputClass}
              >
                <option value="both">Both (EN/ES)</option>
                <option value="en">English Only</option>
                <option value="es">Spanish Only</option>
              </select>
            </FormField>

            <FormField label="Status" required>
              <select
                required
                value={formData.status}
                onChange={(e) => updateFormData({ status: e.target.value })}
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </FormField>
          </div>

          <FormField label="Priority Event">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.isPriority}
                onChange={(e) =>
                  updateFormData({ isPriority: e.target.checked })
                }
                className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-neutral-700">
                Mark as featured/priority event (will appear first in
                recommendations)
              </span>
            </label>
          </FormField>
        </Section>

        {/* Targeting */}
        <Section title="Targeting (Optional)">
          <FormField label="Target Conditions">
            <div className="grid grid-cols-2 gap-2">
              {["hemophilia_a", "hemophilia_b", "von_willebrand", "other"].map(
                (cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleArrayValue("targetConditions", cond)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      formData.targetConditions.includes(cond)
                        ? "border-primary bg-primary-50 text-primary"
                        : "border-neutral-200 hover:border-primary-200"
                    }`}
                  >
                    {cond
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ),
              )}
            </div>
          </FormField>

          <FormField label="Target Severity">
            <div className="grid grid-cols-3 gap-2">
              {["mild", "moderate", "severe"].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => toggleArrayValue("targetSeverity", sev)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    formData.targetSeverity.includes(sev)
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-neutral-200 hover:border-primary-200"
                  }`}
                >
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Target Age Groups">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {["children", "teens", "adults", "seniors"].map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => toggleArrayValue("targetAgeGroups", age)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    formData.targetAgeGroups.includes(age)
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-neutral-200 hover:border-primary-200"
                  }`}
                >
                  {age.charAt(0).toUpperCase() + age.slice(1)}
                </button>
              ))}
            </div>
          </FormField>
        </Section>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Event"
            )}
          </button>
          <Link
            href="/admin/events"
            className="px-8 py-3 rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-neutral-400 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="font-display font-bold text-neutral-900 text-xl mb-6">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-neutral-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = `
  w-full px-4 py-2.5 rounded-xl border border-neutral-200
  text-neutral-900 text-sm placeholder:text-neutral-400
  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
  transition-colors bg-white
`.trim();
