import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

const ROLE_LABELS: Record<string, { en: string; es: string }> = {
  PRESIDENT: { en: "President", es: "Presidenta/e" },
  VICE_PRESIDENT: { en: "Vice President", es: "Vicepresidenta/e" },
  TREASURER: { en: "Treasurer", es: "Tesorera/o" },
  SECRETARY: { en: "Secretary", es: "Secretaria/o" },
  EVENTS_COORDINATOR: {
    en: "Events Coordinator",
    es: "Coordinadora/or de Eventos",
  },
  SPONSOR_LIAISON: { en: "Sponsor Liaison", es: "Enlace de Patrocinadores" },
  COMMUNICATIONS_LEAD: {
    en: "Communications Lead",
    es: "Líder de Comunicaciones",
  },
  YOUTH_COORDINATOR: {
    en: "Youth Coordinator",
    es: "Coordinadora/or de Jóvenes",
  },
  VOLUNTEER_COORDINATOR: {
    en: "Volunteer Coordinator",
    es: "Coordinadora/or de Voluntarios",
  },
  FUNDRAISING_COORDINATOR: {
    en: "Fundraising Coordinator",
    es: "Coordinadora/or de Recaudación",
  },
  BOARD_MEMBER_AT_LARGE: {
    en: "Board Member at Large",
    es: "Miembro de la Comunidad",
  },
};

export default async function PublicBoardHistoryPage() {
  const locale = (await getLocaleCookie()) as Lang;
  const isEs = locale === "es";

  const boardRoles = await prisma.boardRole.findMany({
    include: {
      patient: {
        include: { contactProfile: true },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  // Separate active and past
  const active = boardRoles.filter((r) => r.active);
  const past = boardRoles.filter((r) => !r.active);

  const t = {
    back: isEs ? "Archivo de Transparencia" : "Transparency Archive",
    title: isEs ? "Historial de la Junta Directiva" : "Board Member History",
    subtitle: isEs
      ? "Miembros actuales y anteriores de la junta directiva de HOEP"
      : "Current and former members of the HOEP board of directors",
    current: isEs ? "Junta Directiva Actual" : "Current Board",
    past: isEs ? "Miembros Anteriores" : "Former Members",
    since: isEs ? "Desde" : "Since",
    served: isEs ? "Sirvió" : "Served",
    to: isEs ? "hasta" : "to",
    present: isEs ? "presente" : "present",
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString(isEs ? "es-MX" : "en-US", {
      month: "long",
      year: "numeric",
    });

  const getName = (role: (typeof boardRoles)[0]) => {
    const cp = role.patient.contactProfile;
    return cp ? `${cp.firstName} ${cp.lastName}` : role.patient.email;
  };

  const getRoleLabel = (role: string) =>
    isEs ? (ROLE_LABELS[role]?.es ?? role) : (ROLE_LABELS[role]?.en ?? role);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/archive"
        className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.back}
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            {t.title}
          </h1>
        </div>
        <p className="text-neutral-500">{t.subtitle}</p>
      </div>

      {/* Current board */}
      {active.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            {t.current}
          </h2>
          <div className="space-y-3">
            {active.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200"
              >
                <div>
                  <p className="font-semibold text-neutral-900">{getName(r)}</p>
                  <p className="text-sm text-neutral-500">
                    {getRoleLabel(r.role)}
                  </p>
                </div>
                <div className="text-right text-sm text-neutral-400">
                  <p>
                    {t.since} {formatDate(r.assignedAt)}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold mt-1">
                    {t.present}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past members */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">{t.past}</h2>
          <div className="space-y-3">
            {past.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 opacity-80"
              >
                <div>
                  <p className="font-semibold text-neutral-900">{getName(r)}</p>
                  <p className="text-sm text-neutral-500">
                    {getRoleLabel(r.role)}
                  </p>
                </div>
                <div className="text-right text-sm text-neutral-400">
                  <p>{formatDate(r.assignedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {active.length === 0 && past.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">
            {isEs ? "No hay registros de junta aún." : "No board records yet."}
          </p>
        </div>
      )}
    </div>
  );
}
