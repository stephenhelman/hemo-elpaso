import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";

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

export default async function PublicNewsletterArchivePage() {
  const locale = (await getLocaleCookie()) as Lang;
  const isEs = locale === "es";

  const newsletters = await prisma.newsletter.findMany({
    where: { status: "SENT" },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const t = {
    title: isEs ? "Archivo de Boletines" : "Newsletter Archive",
    subtitle: isEs
      ? "Boletines mensuales de Hemophilia Outreach de El Paso"
      : "Monthly newsletters from Hemophilia Outreach of El Paso",
    empty: isEs
      ? "Aún no hay boletines publicados."
      : "No newsletters published yet.",
    read: isEs ? "Leer boletín" : "Read newsletter",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <Newspaper className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-display font-bold text-neutral-900">
            {t.title}
          </h1>
        </div>
        <p className="text-neutral-500 text-lg">{t.subtitle}</p>
      </div>

      {newsletters.length === 0 ? (
        <div className="text-center py-16">
          <Newspaper className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">{t.empty}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {newsletters.map((n) => {
            const monthName = isEs
              ? MONTH_NAMES_ES[n.month - 1]
              : MONTH_NAMES[n.month - 1];
            return (
              <Link
                key={n.id}
                href={`/newsletter/${n.id}`}
                className="flex items-center justify-between p-6 bg-white rounded-2xl border border-neutral-200 hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary-50">
                    <Newspaper className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 text-lg">
                      {monthName} {n.year}
                    </p>
                    {n.sentAt && (
                      <p className="text-sm text-neutral-500">
                        {new Date(n.sentAt).toLocaleDateString(
                          isEs ? "es-MX" : "en-US",
                          { month: "long", day: "numeric", year: "numeric" },
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  {t.read}
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
