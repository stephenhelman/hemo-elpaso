import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import Link from "next/link";
import { ArrowLeft, BarChart3, FileText, ExternalLink } from "lucide-react";

export default async function PublicFinancialsPage() {
  const locale = (await getLocaleCookie()) as Lang;
  const isEs = locale === "es";

  const [annualReports, taxFilings] = await Promise.all([
    prisma.annualReport.findMany({ orderBy: { year: "desc" } }),
    prisma.taxFiling.findMany({ orderBy: { year: "desc" } }),
  ]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(isEs ? "es-MX" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const t = {
    back: isEs ? "Archivo de Transparencia" : "Transparency Archive",
    title: isEs ? "Reportes Financieros" : "Financial Reports",
    subtitle: isEs
      ? "Resúmenes anuales del impacto y las finanzas de HOEP"
      : "Annual summaries of HOEP's impact and finances",
    annualTitle: isEs ? "Reportes Anuales" : "Annual Reports",
    eventsHeld: isEs ? "Eventos realizados" : "Events held",
    attendance: isEs ? "Asistencia total" : "Total attendance",
    assistancePaid: isEs
      ? "Asistencia financiera pagada"
      : "Financial assistance paid",
    scholarshipsPaid: isEs ? "Becas otorgadas" : "Scholarships awarded",
    sponsorIncome: isEs ? "Ingresos de patrocinadores" : "Sponsor income",
    notes: isEs ? "Notas" : "Notes",
    notDisclosed: isEs ? "No divulgado" : "Not disclosed",
    filingTitle: isEs ? "Declaraciones Form 990" : "Form 990 Filings",
    filingDesc: isEs
      ? "Declaraciones anuales ante el IRS requeridas para organizaciones sin fines de lucro 501(c)(3)"
      : "Annual IRS filings required for 501(c)(3) nonprofit organizations",
    viewPdf: isEs ? "Ver PDF" : "View PDF",
    emptyReports: isEs
      ? "No hay reportes anuales aún."
      : "No annual reports yet.",
    emptyFilings: isEs
      ? "No hay declaraciones 990 aún."
      : "No 990 filings yet.",
  };

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
          <BarChart3 className="w-7 h-7 text-green-600" />
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            {t.title}
          </h1>
        </div>
        <p className="text-neutral-500">{t.subtitle}</p>
      </div>

      {/* Annual Reports */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">
          {t.annualTitle}
        </h2>
        {annualReports.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-neutral-200">
            <p className="text-neutral-400">{t.emptyReports}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {annualReports.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-neutral-200 p-6"
              >
                <h3 className="font-bold text-neutral-900 text-lg mb-4">
                  {r.year}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: t.eventsHeld,
                      value: r.totalEventsHeld.toString(),
                    },
                    {
                      label: t.attendance,
                      value: r.totalAttendance.toLocaleString(),
                    },
                    {
                      label: t.assistancePaid,
                      value: fmt(Number(r.totalAssistancePaid)),
                    },
                    {
                      label: t.scholarshipsPaid,
                      value: fmt(Number(r.totalScholarshipsPaid)),
                    },
                    {
                      label: t.sponsorIncome,
                      value: r.totalSponsorIncome
                        ? fmt(Number(r.totalSponsorIncome))
                        : t.notDisclosed,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-3 rounded-lg bg-neutral-50"
                    >
                      <p className="text-xs text-neutral-500 mb-1">
                        {stat.label}
                      </p>
                      <p className="font-bold text-neutral-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
                {r.notes && (
                  <p className="text-sm text-neutral-500 mt-4 pt-4 border-t border-neutral-100">
                    {r.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 990 Filings */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          {t.filingTitle}
        </h2>
        <p className="text-sm text-neutral-500 mb-4">{t.filingDesc}</p>
        {taxFilings.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-neutral-200">
            <p className="text-neutral-400">{t.emptyFilings}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {taxFilings.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-5 bg-white rounded-xl border border-neutral-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">
                      Form 990 — {f.year}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {new Date(f.createdAt).toLocaleDateString(
                        isEs ? "es-MX" : "en-US",
                        { month: "long", year: "numeric" },
                      )}
                    </p>
                  </div>
                </div>
                <a
                  href={f.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t.viewPdf}
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
