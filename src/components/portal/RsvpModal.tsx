"use client";

import { useState, useEffect } from "react";
import { X, Check, Loader2, Users } from "lucide-react";
import type { Lang } from "@/types";
import type { FamilyMember } from "@/types/family";

interface Event {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  eventDate: Date;
  location: string;
}

interface Props {
  event: Event | null;
  familyMembers: FamilyMember[];
  locale: Lang;
  onClose: () => void;
  onSuccess: (eventId: string, newAttendeeCount?: number) => void;
  // Optional props for edit mode:
  mode?: "create" | "change";
  rsvpId?: string;
  initialSelectedIds?: string[];
}

const t = {
  en: {
    whoAttending: "Who's attending?",
    updateRsvp: "Update Your RSVP",
    you: "You",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    attending: "attending",
    confirmRsvp: "Confirm RSVP",
    updateButton: "Update RSVP",
    cancel: "Cancel",
    success: "RSVP Confirmed!",
    updateSuccess: "RSVP Updated!",
    failed: "Failed — please try again",
    retry: "Try again",
    relationship: {
      spouse: "Spouse",
      son: "Son",
      daughter: "Daughter",
      parent: "Parent",
      sibling: "Sibling",
    } as Record<string, string>,
    ageTier: {
      YOUTH: "Youth",
      ADULT: "Adult",
      RECORD_ONLY: "Child",
    } as Record<string, string>,
  },
  es: {
    whoAttending: "¿Quién asistirá?",
    updateRsvp: "Actualizar su RSVP",
    you: "Usted",
    selectAll: "Seleccionar todos",
    deselectAll: "Deseleccionar todos",
    attending: "asistentes",
    confirmRsvp: "Confirmar RSVP",
    updateButton: "Actualizar RSVP",
    cancel: "Cancelar",
    success: "¡RSVP Confirmado!",
    updateSuccess: "¡RSVP Actualizado!",
    failed: "Error — intente de nuevo",
    retry: "Intentar de nuevo",
    relationship: {
      spouse: "Cónyuge",
      son: "Hijo",
      daughter: "Hija",
      parent: "Padre/Madre",
      sibling: "Hermano/a",
    } as Record<string, string>,
    ageTier: {
      YOUTH: "Joven",
      ADULT: "Adulto",
      RECORD_ONLY: "Niño/a",
    } as Record<string, string>,
  },
};

export default function RsvpModal({
  event,
  familyMembers,
  locale,
  onClose,
  onSuccess,
  mode = "create",
  rsvpId,
  initialSelectedIds,
}: Props) {
  const tr = t[locale];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [visible, setVisible] = useState(false);

  // Reset + animate in when event changes
  useEffect(() => {
    if (event) {
      if (initialSelectedIds !== undefined) {
        // Change mode: pre-select the provided IDs
        setSelectedIds(new Set(initialSelectedIds));
      } else {
        // Create mode: pre-select all active family members by default
        setSelectedIds(new Set(familyMembers.map((m) => m.id)));
      }
      setStatus("idle");
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [event?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!event) return null;

  const allSelected = familyMembers.length > 0 && selectedIds.size === familyMembers.length;
  const attendeeCount = selectedIds.size + 1; // family members + patient themselves

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(familyMembers.map((m) => m.id)));
    }
  };

  const handleConfirm = async () => {
    if (!event) return;
    setStatus("loading");
    try {
      if (mode === "change" && rsvpId) {
        const res = await fetch("/api/rsvp", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rsvpId,
            familyMembershipIds: Array.from(selectedIds),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setStatus("success");
          setTimeout(() => {
            onSuccess(event.id, data.attendeeCount);
            onClose();
          }, 1200);
        } else {
          setStatus("error");
        }
      } else {
        const res = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: event.id,
            familyMembershipIds: Array.from(selectedIds),
          }),
        });
        if (res.ok) {
          setStatus("success");
          setTimeout(() => {
            onSuccess(event.id);
            onClose();
          }, 1200);
        } else {
          setStatus("error");
        }
      }
    } catch {
      setStatus("error");
    }
  };

  const title = locale === "es" ? event.titleEs : event.titleEn;
  const modalHeading = mode === "change" ? tr.updateRsvp : tr.whoAttending;
  const confirmButtonLabel = mode === "change" ? tr.updateButton : tr.confirmRsvp;
  const successLabel = mode === "change" ? tr.updateSuccess : tr.success;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={status === "loading" ? undefined : onClose}
      />

      {/* Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none`}>
        <div
          className={`bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto transition-all duration-300 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-neutral-100">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="font-display font-bold text-neutral-900 text-xl mb-0.5">
                {modalHeading}
              </h2>
              <p className="text-sm text-neutral-500 truncate">{title}</p>
            </div>
            <button
              onClick={onClose}
              disabled={status === "loading"}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-3">
            {/* You — always included */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-200">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 text-sm">{tr.you}</p>
              </div>
            </div>

            {/* Family members */}
            {familyMembers.length > 0 && (
              <>
                {/* Select All toggle */}
                <button
                  type="button"
                  onClick={toggleAll}
                  disabled={status === "loading"}
                  className="w-full text-sm text-primary font-semibold text-left hover:underline disabled:opacity-50 py-1"
                >
                  {allSelected ? tr.deselectAll : tr.selectAll}
                </button>

                {familyMembers.map((member) => {
                  const checked = selectedIds.has(member.id);
                  const rel = tr.relationship[member.relationship] ?? member.relationship;
                  const tier = tr.ageTier[member.ageTier] ?? member.ageTier;

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      disabled={status === "loading"}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        checked
                          ? "border-primary bg-primary-50"
                          : "border-neutral-200 hover:border-primary-200 hover:bg-neutral-50"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked ? "bg-primary border-primary" : "border-neutral-300"
                      }`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 text-sm">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-neutral-500 capitalize">
                          {rel} · {tier}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </>
            )}

            {/* Attendee count */}
            <div className="flex items-center gap-2 pt-1 text-sm text-neutral-600">
              <Users className="w-4 h-4 text-primary" />
              <span>
                <span className="font-bold text-neutral-900">{attendeeCount}</span>{" "}
                {tr.attending}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 space-y-2">
            {status === "success" ? (
              <div className="flex items-center justify-center gap-2 py-3 rounded-full bg-green-50 border border-green-200 text-green-700 font-semibold text-sm">
                <Check className="w-4 h-4" />
                {successLabel}
              </div>
            ) : status === "error" ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 flex-1">{tr.failed}</span>
                <button
                  onClick={() => setStatus("idle")}
                  className="text-sm text-primary hover:underline font-semibold"
                >
                  {tr.retry}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={status === "loading"}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
              >
                {status === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {confirmButtonLabel}
              </button>
            )}

            {status !== "success" && (
              <button
                onClick={onClose}
                disabled={status === "loading"}
                className="w-full py-2.5 rounded-full border border-neutral-200 text-neutral-600 font-semibold text-sm hover:border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                {tr.cancel}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
