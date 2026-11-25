"use client";

import { useState } from "react";
import AgeGroupPicker from "@/components/admin/events/AgeGroupPicker";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toSiteDatetimeLocal, fromSiteDatetimeLocal } from "@/lib/datetime";

import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";
import FlyerUpload from "./FlyerUpload";
import BilingualInput from "@/components/form/BilingualInput";
import PlacesAutocompleteInput from "@/components/form/PlacesAutocompleteInput";
import { adminEventEditTranslation } from "@/translation/adminPages";
import type { Lang } from "@/types";
import SponsorPicker, { type SponsorOption } from "./SponsorPicker";

interface Event {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  flyerEnUrl: string | null;
  flyerEsUrl: string | null;
  eventDate: Date;
  endDate: Date | null;
  location: string;
  maxCapacity: number | null;
  rsvpDeadline: Date | null;
  status: string;
  category: string;
  targetAudience: string;
  language: string;
  isPriority: boolean;
  liveEnabled: boolean;
  rsvpAccess: string;
  isRecorded?: boolean;
  sponsorSanityIds: string[];
  targeting: {
    targetConditions: string[];
    targetSeverity: string[];
    targetAgeGroups: string[];
    targetInterests: string[];
  } | null;
}

// datetime-local fields are Mountain Time (the site zone), whatever zone the admin's browser is in
const toLocalInput = (d: Date) => toSiteDatetimeLocal(d);
const fromLocalInput = (v: string) => (fromSiteDatetimeLocal(v) ?? new Date(NaN)).toISOString();

interface Props {
  event: Event;
  locale: Lang;
  sponsorOptions?: SponsorOption[];
}

export default function EventEditForm({ event, locale, sponsorOptions = [] }: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const t = adminEventEditTranslation[locale];

  const [formData, setFormData] = useState({
    title: {
      en: event?.titleEn,
      es: event?.titleEs,
    },
    description: {
      en: event.descriptionEn || "",
      es: event.descriptionEs || "",
    },
    eventDate: toLocalInput(new Date(event.eventDate)),
    location: event.location,
    maxCapacity: event.maxCapacity?.toString() || "",
    rsvpDeadline: event.rsvpDeadline ? toLocalInput(new Date(event.rsvpDeadline)) : "",
    endDate: event.endDate ? toLocalInput(new Date(event.endDate)) : "",
    status: event.status,
    category: event.category,
    targetAudience: event.targetAudience,
    language: event.language,
    isPriority: event.isPriority,
    liveEnabled: event.liveEnabled,
    rsvpAccess: event.rsvpAccess === "invited_only" ? "invited_only" : "any_approved",
    isRecorded: event.isRecorded ?? false,
    targetConditions: event.targeting?.targetConditions ?? ([] as string[]),
    targetAgeGroups: event.targeting?.targetAgeGroups ?? ([] as string[]),
    sponsorSanityIds: event.sponsorSanityIds ?? ([] as string[]),
  });

  const handleFlyerUploadComplete = () => {
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = {
        titleEn: formData.title.en,
        titleEs: formData.title.es,
        descriptionEn: formData.description.en,
        descriptionEs: formData.description.es,
        // datetime-local values are Mountain Time: send UTC ISO so the server doesn't reinterpret them in its own timezone
        eventDate: fromLocalInput(formData.eventDate),
        endDate: formData.endDate ? fromLocalInput(formData.endDate) : null,
        location: formData.location,
        maxCapacity: formData.maxCapacity
          ? parseInt(formData.maxCapacity)
          : null,
        rsvpDeadline: formData.rsvpDeadline ? fromLocalInput(formData.rsvpDeadline) : null,
        status: formData.status,
        category: formData.category,
        targetAudience: formData.targetAudience,
        language: formData.language,
        isPriority: formData.isPriority,
        liveEnabled: formData.liveEnabled,
        rsvpAccess: formData.rsvpAccess,
        isRecorded: formData.isRecorded,
        targetConditions: formData.targetConditions,
        targetAgeGroups: formData.targetAgeGroups,
        sponsorSanityIds: formData.sponsorSanityIds,
      };
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        router.push("/admin/events");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || t.errorUpdate);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errorUpdate);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t.deleteConfirmTitle,
      message: t.deleteConfirmMsg,
      confirmText: t.deleteConfirmBtn,
      variant: "danger",
    });
    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/events");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || t.errorDelete);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errorDelete);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ConfirmDialog />
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-2xl border border-neutral-200 p-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-display font-bold text-neutral-900">
              {t.basicInfo}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BilingualInput
                label={t.eventTitle}
                name="title"
                value={formData.title}
                onChange={(value) => setFormData({ ...formData, title: value })}
                placeholder={t.titlePlaceholder}
                type="input"
                required
              />
            </div>

            <BilingualInput
              label={t.eventDescription}
              name="description"
              value={formData.description}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              placeholder={t.descriptionPlaceholder}
              type="textarea"
              rows={4}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t.dateTime}
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Ends (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  RSVPs and the check-in QR stop after this. Blank = start + 12 hours.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t.rsvpDeadline}
                </label>
                <input
                  type="datetime-local"
                  value={formData.rsvpDeadline}
                  onChange={(e) =>
                    setFormData({ ...formData, rsvpDeadline: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t.location}
              </label>
              <PlacesAutocompleteInput
                value={formData.location}
                onChange={(v) => setFormData({ ...formData, location: v })}
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t.maxCapacity}
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, maxCapacity: e.target.value })
                }
                placeholder={t.capacityPlaceholder}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t.status}
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">{t.statusOptions.draft}</option>
                  <option value="published">{t.statusOptions.published}</option>
                  <option value="cancelled">{t.statusOptions.cancelled}</option>
                  <option value="completed">{t.statusOptions.completed}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t.category}
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="EDUCATION">
                    {t.categoryOptions.EDUCATION}
                  </option>
                  <option value="FAMILY_SUPPORT">
                    {t.categoryOptions.FAMILY_SUPPORT}
                  </option>
                  <option value="YOUTH">{t.categoryOptions.YOUTH}</option>
                  <option value="FUNDRAISING">
                    {t.categoryOptions.FUNDRAISING}
                  </option>
                  <option value="MEDICAL_UPDATE">
                    {t.categoryOptions.MEDICAL_UPDATE}
                  </option>
                  <option value="SOCIAL">{t.categoryOptions.SOCIAL}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPriority}
                  onChange={(e) =>
                    setFormData({ ...formData, isPriority: e.target.checked })
                  }
                  className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-neutral-700">
                  {t.priorityEvent}
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5" htmlFor="rsvpAccess">Who can RSVP</label>
                <select
                  id="rsvpAccess"
                  value={formData.rsvpAccess}
                  onChange={(e) => setFormData({ ...formData, rsvpAccess: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="any_approved">Any approved household</option>
                  <option value="invited_only">Invited households only</option>
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  Invited only: RSVP through the invitation link. Any approved household: an approved household that was not invited can still RSVP. Events that target a diagnosis are always invited only.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={formData.isRecorded}
                  onChange={(e) => setFormData({ ...formData, isRecorded: e.target.checked })}
                  className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-neutral-700">
                  This event is recorded or streamed (shows the recording notice on the RSVP page once recordings are available)
                </span>
              </label>
            </div>
          </div>
          <div className="border-t mt-4 border-neutral-200 pt-8 mb-8">
            <h3 className="text-xl font-display font-bold text-neutral-900 mb-1">Sponsors</h3>
            <p className="text-sm text-neutral-600 mb-4">Shown as &ldquo;Sponsored by&rdquo; on the public event page. Manage sponsors in the Studio.</p>
            <SponsorPicker options={sponsorOptions} value={formData.sponsorSanityIds} onChange={(ids) => setFormData((f) => ({ ...f, sponsorSanityIds: ids }))} />
          </div>
          <div className="border-t mt-4 border-neutral-200 pt-8">
            <h3 className="text-xl font-display font-bold text-neutral-900 mb-1">
              Invitation targeting
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Leave empty to invite everyone. Otherwise only households with a matching stated diagnosis are matched. Never shown to patients.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-8">
              {["hemophilia_a", "hemophilia_b", "von_willebrand", "other", "carrier", "family_caregiver"].map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() =>
                    setFormData((f) => ({
                      ...f,
                      targetConditions: f.targetConditions.includes(cond)
                        ? f.targetConditions.filter((c) => c !== cond)
                        : [...f.targetConditions, cond],
                    }))
                  }
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    formData.targetConditions.includes(cond)
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-neutral-200 hover:border-primary-200"
                  }`}
                >
                  {cond.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-1">Age groups</h4>
            <p className="text-xs text-neutral-500 mb-2">
              Leave empty for any age. A household matches if any eligible person (primary, minors, confirmed adults) is in a selected group
              {formData.targetConditions.length > 0 ? " and has a targeted diagnosis" : ""}.
            </p>
            <div className="mb-8">
              <AgeGroupPicker
                value={formData.targetAgeGroups}
                onChange={(v) => setFormData((f) => ({ ...f, targetAgeGroups: v }))}
              />
            </div>
          </div>
          <div className="border-t mt-4 border-neutral-200 pt-8">
            <h3 className="text-xl font-display font-bold text-neutral-900 mb-4">
              {t.flyersTitle}
            </h3>
            <p className="text-sm text-neutral-600 mb-4">{t.flyersDesc}</p>
            <FlyerUpload
              eventId={event.id}
              currentFlyerEn={event.flyerEnUrl}
              currentFlyerEs={event.flyerEsUrl}
              onUploadComplete={handleFlyerUploadComplete}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-red-600 text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.deleting}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {t.deleteEvent}
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              t.saveChanges
            )}
          </button>
        </div>
      </form>
    </>
  );
}
