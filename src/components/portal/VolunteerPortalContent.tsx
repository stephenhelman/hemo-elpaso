"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, Clock, ExternalLink, XCircle } from "lucide-react";
import type { Lang } from "@/types";

interface TimecardEvent {
  titleEn: string;
  titleEs: string;
}

interface Timecard {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  totalHours: string | number | null;
  status: string;
  event: TimecardEvent;
}

interface AssignmentEvent {
  id: string;
  titleEn: string;
  titleEs: string;
  eventDate: string;
  location: string | null;
  slug: string;
}

interface Assignment {
  id: string;
  role: string;
  assignedAt: string;
  accessToken: string;
  event: AssignmentEvent;
}

interface VolunteerProfile {
  id: string;
  status: string;
  rejectionReason: string | null;
  applications: { submittedAt: string | null }[];
  eventAssignments: Assignment[];
  timecards: Timecard[];
}

interface Props {
  profile: VolunteerProfile;
  locale: Lang;
}

const t = {
  en: {
    volunteerStatus: "Volunteer Status",
    pending: "Application Under Review",
    pendingDesc:
      "Your volunteer application has been submitted and is being reviewed by our team. We'll email you once a decision has been made.",
    approved: "Approved Volunteer",
    rejected: "Application Not Approved",
    rejectionReason: "Reason",
    assignments: "Event Assignments",
    noAssignments: "No event assignments yet. Check back after staff assigns you to an event.",
    checkIn: "Check In",
    timecards: "My Timecards",
    noTimecards: "No timecards yet.",
    active: "Active",
    completed: "Completed",
    checkOut: "Check Out",
    checkingOut: "Checking out…",
    hours: "hrs",
    role: "Role",
    viewReference: "View Service Record",
  },
  es: {
    volunteerStatus: "Estado de Voluntariado",
    pending: "Solicitud en Revisión",
    pendingDesc:
      "Su solicitud de voluntariado ha sido enviada y está siendo revisada por nuestro equipo. Le notificaremos por correo cuando se tome una decisión.",
    approved: "Voluntario Aprobado",
    rejected: "Solicitud No Aprobada",
    rejectionReason: "Razón",
    assignments: "Asignaciones de Eventos",
    noAssignments: "Sin asignaciones aún. Vuelva a revisar después de que el personal lo asigne a un evento.",
    checkIn: "Registrar Entrada",
    timecards: "Mis Registros de Tiempo",
    noTimecards: "Sin registros aún.",
    active: "Activo",
    completed: "Completado",
    checkOut: "Registrar Salida",
    checkingOut: "Registrando salida…",
    hours: "hrs",
    role: "Rol",
    viewReference: "Ver Registro de Servicio",
  },
};

export default function VolunteerPortalContent({ profile, locale }: Props) {
  const copy = t[locale];
  const [timecards, setTimecards] = useState<Timecard[]>(profile.timecards);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);

  const handleCheckOut = async (timecardId: string) => {
    setCheckingOutId(timecardId);
    try {
      const res = await fetch("/api/portal/volunteer/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timecardId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTimecards((prev) =>
        prev.map((tc) =>
          tc.id === timecardId
            ? {
                ...tc,
                checkOutTime: new Date().toISOString(),
                totalHours: data.totalHours,
                status: "completed",
              }
            : tc,
        ),
      );
      toast.success(`Checked out — ${data.totalHours} ${copy.hours}`);
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setCheckingOutId(null);
    }
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-elpaso.vercel.app";

  return (
    <div className="space-y-8">
      {/* Status card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-lg font-display font-bold text-neutral-900 mb-4">
          {copy.volunteerStatus}
        </h2>

        {profile.status === "PENDING_REVIEW" && (
          <div className="flex items-start gap-3 text-amber-700">
            <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{copy.pending}</p>
              <p className="text-sm text-neutral-500 mt-1">{copy.pendingDesc}</p>
            </div>
          </div>
        )}

        {profile.status === "APPROVED" && (
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">{copy.approved}</p>
          </div>
        )}

        {profile.status === "REJECTED" && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-red-700">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-semibold">{copy.rejected}</p>
            </div>
            {profile.rejectionReason && (
              <p className="text-sm text-neutral-500 ml-8">
                <span className="font-medium">{copy.rejectionReason}:</span>{" "}
                {profile.rejectionReason}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Event Assignments (only for approved) */}
      {profile.status === "APPROVED" && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-lg font-display font-bold text-neutral-900 mb-4">
            {copy.assignments}
          </h2>
          {profile.eventAssignments.length === 0 ? (
            <p className="text-sm text-neutral-400">{copy.noAssignments}</p>
          ) : (
            <div className="space-y-3">
              {profile.eventAssignments.map((assignment) => {
                const title =
                  locale === "es" ? assignment.event.titleEs : assignment.event.titleEn;
                const checkinUrl = `${baseUrl}/events/${assignment.event.slug}/checkin/${assignment.accessToken}`;
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl border border-neutral-100 bg-neutral-50"
                  >
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">{title}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(assignment.event.eventDate).toLocaleDateString(
                          locale === "es" ? "es-MX" : "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                        {assignment.event.location && ` · ${assignment.event.location}`}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {copy.role}: {assignment.role.replace(/_/g, " ")}
                      </p>
                    </div>
                    <a
                      href={checkinUrl}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {copy.checkIn}
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Timecards */}
      {profile.status === "APPROVED" && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-neutral-900">
              {copy.timecards}
            </h2>
            <a
              href="/portal/volunteer/reference"
              className="text-sm text-primary hover:underline font-medium"
            >
              {copy.viewReference}
            </a>
          </div>
          {timecards.length === 0 ? (
            <p className="text-sm text-neutral-400">{copy.noTimecards}</p>
          ) : (
            <div className="space-y-3">
              {timecards.map((tc) => {
                const eventTitle =
                  locale === "es" ? tc.event.titleEs : tc.event.titleEn;
                const isActive = tc.status === "active" && !tc.checkOutTime;
                return (
                  <div
                    key={tc.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl border border-neutral-100"
                  >
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">{eventTitle}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(tc.checkInTime).toLocaleTimeString(
                          locale === "es" ? "es-MX" : "en-US",
                          { hour: "numeric", minute: "2-digit" },
                        )}
                        {tc.checkOutTime &&
                          ` → ${new Date(tc.checkOutTime).toLocaleTimeString(
                            locale === "es" ? "es-MX" : "en-US",
                            { hour: "numeric", minute: "2-digit" },
                          )}`}
                        {tc.totalHours != null &&
                          ` · ${Number(tc.totalHours).toFixed(2)} ${copy.hours}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <button
                          onClick={() => handleCheckOut(tc.id)}
                          disabled={checkingOutId === tc.id}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {checkingOutId === tc.id ? copy.checkingOut : copy.checkOut}
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                          {copy.completed}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
