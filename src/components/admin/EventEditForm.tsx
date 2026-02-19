"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";
import FlyerUpload from "./FlyerUpload";
import BilingualInput from "@/components/form/BilingualInput";

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
  location: string;
  maxCapacity: number | null;
  rsvpDeadline: Date | null;
  status: string;
  category: string;
  targetAudience: string;
  language: string;
  isPriority: boolean;
  liveEnabled: boolean;
  targeting: {
    targetConditions: string[];
    targetSeverity: string[];
    targetAgeGroups: string[];
    targetInterests: string[];
  } | null;
}

interface Props {
  event: Event;
}

export default function EventEditForm({ event }: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: {
      en: event?.titleEn,
      es: event?.titleEs,
    },
    description: {
      en: event.descriptionEn || "",
      es: event.descriptionEs || "",
    },
    eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
    location: event.location,
    maxCapacity: event.maxCapacity?.toString() || "",
    rsvpDeadline: event.rsvpDeadline
      ? new Date(event.rsvpDeadline).toISOString().slice(0, 16)
      : "",
    status: event.status,
    category: event.category,
    targetAudience: event.targetAudience,
    language: event.language,
    isPriority: event.isPriority,
    liveEnabled: event.liveEnabled,
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
        eventDate: formData.eventDate,
        location: formData.location,
        maxCapacity: formData.maxCapacity
          ? parseInt(formData.maxCapacity)
          : null,
        rsvpDeadline: formData.rsvpDeadline || null,
        status: formData.status,
        category: formData.category,
        targetAudience: formData.targetAudience,
        language: formData.language,
        isPriority: formData.isPriority,
        liveEnabled: formData.liveEnabled,
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
        toast.error(data.error || "Failed to update event");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update event",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Event?",
      message:
        "Are you sure you want to delete this event? This action cannot be undone.",
      confirmText: "Delete",
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
        toast.error(data.error || "Failed to delete event");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete event",
      );
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
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BilingualInput
                label="Event Title"
                name="title"
                value={formData.title}
                onChange={(value) => setFormData({ ...formData, title: value })}
                placeholder="Enter event title..."
                type="input"
                required
              />
            </div>

            <BilingualInput
              label="Event Description"
              name="description"
              value={formData.description}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              placeholder="Enter event description..."
              type="textarea"
              rows={4}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Event Date & Time *
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
                  RSVP Deadline
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
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Max Capacity
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, maxCapacity: e.target.value })
                }
                placeholder="Leave empty for unlimited"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="EDUCATION">Education</option>
                  <option value="FAMILY_SUPPORT">Family Support</option>
                  <option value="YOUTH">Youth</option>
                  <option value="FUNDRAISING">Fundraising</option>
                  <option value="MEDICAL_UPDATE">Medical Update</option>
                  <option value="SOCIAL">Social</option>
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
                  Priority Event
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.liveEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, liveEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-neutral-700">
                  Enable Live Features
                </span>
              </label>
            </div>
          </div>
          <div className="border-t border-neutral-200 pt-8">
            <h3 className="text-xl font-display font-bold text-neutral-900 mb-4">
              Event Flyers
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Upload PDF flyers in both English and Spanish for attendees to
              view and download.
            </p>
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
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Event
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
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
