import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default async function PublicScholarshipsPage() {
  const locale = (await getLocaleCookie()) as Lang;
  const isEs = locale === "es";

  const scholarships = await prisma.scholarship.findMany({
    orderBy: [{ awardedAt: "desc" }],
  });

  // Group by academic year
  const grouped = scholarships.reduce(
    (acc, s) => {
      if (!acc[s.academicYear]) acc[s.academicYear] = [];
      acc[s.academicYear].push(s);
      return acc;
    },
    {} as Record<string, typeof scholarships>,
  );

  const years = Object.keys(grouped).sort().reverse();

  const t = {
    back: isEs ? "Archivo de Transparencia" : "Transparency Archive",
    title: isEs ? "Becas Otorgadas" : "Scholarships Awarded",
    subtitle: isEs
      ? "Registro histórico de becas otorgadas a miembros de nuestra comunidad"
      : "Historical record of scholarships awarded to members of our community",
    empty: isEs
      ? "No hay becas registradas aún."
      : "No scholarships on record yet.",
    total: isEs ? "Total del año:" : "Year total:",
    fmt: (n: number) =>
      new Intl.NumberFormat(isEs ? "es-MX" : "en-US", {
        style: "currency",
        currency: "USD",
      }).format(n),
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
          <GraduationCap className="w-7 h-7 text-amber-500" />
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            {t.title}
          </h1>
        </div>
        <p className="text-neutral-500">{t.subtitle}</p>
      </div>

      {years.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">{t.empty}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {years.map((year) => {
            const group = grouped[year];
            const yearTotal = group.reduce(
              (sum, s) => sum + Number(s.amount),
              0,
            );
            return (
              <div key={year}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-neutral-900">{year}</h2>
                  <span className="text-sm text-neutral-500">
                    {t.total} <strong>{t.fmt(yearTotal)}</strong>
                  </span>
                </div>
                <div className="space-y-3">
                  {group.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200"
                    >
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {s.recipientName}
                        </p>
                        {s.description && (
                          <p className="text-sm text-neutral-500 mt-0.5">
                            {s.description}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 mt-1">
                          {new Date(s.awardedAt).toLocaleDateString(
                            isEs ? "es-MX" : "en-US",
                            { month: "long", day: "numeric", year: "numeric" },
                          )}
                        </p>
                      </div>
                      <span className="font-bold text-neutral-900 text-lg">
                        {t.fmt(Number(s.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
