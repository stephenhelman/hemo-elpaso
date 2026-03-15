import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default async function PublicMinutesArchivePage() {
  const locale = (await getLocaleCookie()) as Lang;
  const isEs = locale === "es";

  const minutes = await prisma.boardMinutes.findMany({
    where: { isPublic: true },
    orderBy: { meetingDate: "desc" },
  });

  const t = {
    title: isEs ? "Actas de Reuniones" : "Board Meeting Minutes",
    subtitle: isEs
      ? "Registros oficiales de las reuniones de la junta directiva"
      : "Official records of board meetings for organizational transparency",
    empty: isEs ? "Aún no hay actas publicadas." : "No minutes published yet.",
    view: isEs ? "Ver actas" : "View minutes",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-display font-bold text-neutral-900">
            {t.title}
          </h1>
        </div>
        <p className="text-neutral-500 text-lg">{t.subtitle}</p>
      </div>

      {minutes.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">{t.empty}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {minutes.map((m) => (
            <Link
              key={m.id}
              href={`/minutes/${m.id}`}
              className="flex items-center justify-between p-6 bg-white rounded-2xl border border-neutral-200 hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-neutral-50">
                  <FileText className="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-lg">
                    {m.title}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {new Date(m.meetingDate).toLocaleDateString(
                      isEs ? "es-MX" : "en-US",
                      { month: "long", day: "numeric", year: "numeric" },
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                {t.view}
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
