import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import Link from "next/link";
import {
  Newspaper,
  FileText,
  GraduationCap,
  BarChart3,
  Calendar,
  Users,
  ArrowRight,
} from "lucide-react";

export default async function TransparencyArchivePage() {
  const locale = (await getLocaleCookie()) as Lang;
  const isEs = locale === "es";

  // Fetch counts and latest for each section
  const [
    newsletterCount,
    minutesCount,
    scholarshipCount,
    annualReports,
    taxFilings,
    latestNewsletter,
    latestMinutes,
  ] = await Promise.all([
    prisma.newsletter.count({ where: { status: "SENT" } }),
    prisma.boardMinutes.count({ where: { isPublic: true } }),
    prisma.scholarship.count(),
    prisma.annualReport.findMany({ orderBy: { year: "desc" } }),
    prisma.taxFiling.findMany({ orderBy: { year: "desc" } }),
    prisma.newsletter.findFirst({
      where: { status: "SENT" },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    prisma.boardMinutes.findFirst({
      where: { isPublic: true },
      orderBy: { meetingDate: "desc" },
    }),
  ]);

  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const MONTH_NAMES_ES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const t = {
    title: isEs ? "Archivo de Transparencia" : "Transparency Archive",
    subtitle: isEs
      ? "Hemophilia Outreach de El Paso se compromete con la transparencia total hacia nuestra comunidad."
      : "Hemophilia Outreach of El Paso is committed to full transparency with our community.",
    newsletters: isEs ? "Boletines" : "Newsletters",
    newslettersDesc: isEs
      ? "Recaps mensuales de eventos, encuestas y anuncios"
      : "Monthly recaps of events, polls, and announcements",
    minutes: isEs ? "Actas de Reuniones" : "Board Meeting Minutes",
    minutesDesc: isEs
      ? "Registros oficiales de las reuniones de la junta"
      : "Official records of board meetings",
    scholarships: isEs ? "Becas Otorgadas" : "Scholarships Awarded",
    scholarshipsDesc: isEs
      ? "Registros históricos de becas a miembros de la comunidad"
      : "Historical record of scholarships awarded to community members",
    financials: isEs ? "Reportes Anuales" : "Annual Reports",
    financialsDesc: isEs
      ? "Resúmenes financieros anuales e informes de impacto"
      : "Annual financial summaries and impact reports",
    filings: isEs ? "Declaraciones 990" : "Form 990 Filings",
    filingsDesc: isEs
      ? "Declaraciones fiscales anuales ante el IRS"
      : "Annual IRS tax filings for our nonprofit",
    view: isEs ? "Ver todo" : "View all",
    records: isEs ? "registros" : "records",
    latest: isEs ? "Más reciente:" : "Latest:",
    fmt: (n: number) =>
      new Intl.NumberFormat(isEs ? "es-MX" : "en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n),
  };

  const sections = [
    {
      icon: Newspaper,
      title: t.newsletters,
      desc: t.newslettersDesc,
      href: "/newsletter",
      count: newsletterCount,
      latest: latestNewsletter
        ? `${isEs ? MONTH_NAMES_ES[latestNewsletter.month - 1] : MONTH_NAMES[latestNewsletter.month - 1]} ${latestNewsletter.year}`
        : null,
      color: "bg-primary-50 text-primary",
    },
    {
      icon: FileText,
      title: t.minutes,
      desc: t.minutesDesc,
      href: "/minutes",
      count: minutesCount,
      latest: latestMinutes
        ? new Date(latestMinutes.meetingDate).toLocaleDateString(
            isEs ? "es-MX" : "en-US",
            { month: "long", day: "numeric", year: "numeric" },
          )
        : null,
      color: "bg-neutral-100 text-neutral-600",
    },
    {
      icon: GraduationCap,
      title: t.scholarships,
      desc: t.scholarshipsDesc,
      href: "/archive/scholarships",
      count: scholarshipCount,
      latest: null,
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: BarChart3,
      title: t.financials,
      desc: t.financialsDesc,
      href: "/archive/financials",
      count: annualReports.length,
      latest: annualReports[0] ? String(annualReports[0].year) : null,
      color: "bg-green-50 text-green-600",
    },
    {
      icon: FileText,
      title: t.filings,
      desc: t.filingsDesc,
      href: "/archive/990",
      count: taxFilings.length,
      latest: taxFilings[0] ? String(taxFilings[0].year) : null,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-display font-bold text-neutral-900 mb-4">
          {t.title}
        </h1>
        <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      {/* Section cards */}
      <div className="grid gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center justify-between p-6 bg-white rounded-2xl border border-neutral-200 hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-5">
                <div className={`p-3 rounded-xl ${section.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-lg">
                    {section.title}
                  </p>
                  <p className="text-sm text-neutral-500">{section.desc}</p>
                  {section.latest && (
                    <p className="text-xs text-neutral-400 mt-1">
                      {t.latest} {section.latest}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {section.count > 0 && (
                  <span className="text-sm text-neutral-400">
                    {section.count} {t.records}
                  </span>
                )}
                <ArrowRight className="w-5 h-5 text-neutral-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
