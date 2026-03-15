import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import MinutesViewer from "@/components/admin/minutes/MinutesViewer";
import type { MinutesSection } from "@/components/admin/minutes/MinutesEditor";

interface Props {
  params: { id: string };
}

export default async function PublicMinutesDetailPage({ params }: Props) {
  const locale = (await getLocaleCookie()) as Lang;
  const isEs = locale === "es";

  const minutes = await prisma.boardMinutes.findUnique({
    where: { id: params.id, isPublic: true },
  });

  if (!minutes) notFound();

  const content = minutes.content as { sections: MinutesSection[] };

  const t = {
    back: isEs ? "Actas de Reuniones" : "Board Meeting Minutes",
    officialRecord: isEs ? "Acta Oficial" : "Official Record",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/minutes"
        className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.back}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-6 h-6 text-neutral-400" />
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            {t.officialRecord}
          </span>
        </div>
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          {minutes.title}
        </h1>
        <p className="text-neutral-500">
          {new Date(minutes.meetingDate).toLocaleDateString(
            isEs ? "es-MX" : "en-US",
            { weekday: "long", month: "long", day: "numeric", year: "numeric" },
          )}
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8">
        <MinutesViewer
          sections={content.sections}
          lang={locale}
          isPublicView={true}
        />
      </div>
    </div>
  );
}
