import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  BarChart3,
  HelpCircle,
  Image as ImageIcon,
} from "lucide-react";
import type { NewsletterContent } from "@/lib/newsletter-generator";

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

interface Props {
  params: { id: string };
}

export default async function PublicNewsletterPage({ params }: Props) {
  const locale = (await getLocaleCookie()) as Lang;
  const isEs = locale === "es";

  const newsletter = await prisma.newsletter.findUnique({
    where: { id: params.id, status: "SENT" },
  });

  if (!newsletter) notFound();

  const content =
    newsletter.generatedContentJson as unknown as NewsletterContent;
  const monthName = isEs
    ? MONTH_NAMES_ES[newsletter.month - 1]
    : MONTH_NAMES[newsletter.month - 1];

  const t = {
    back: isEs ? "Archivo de Boletines" : "Newsletter Archive",
    from: isEs ? "Mensaje de la Presidenta" : "Message from the President",
    recaps: isEs ? "Lo que ocurrió" : "What Happened",
    attended: isEs ? "asistieron" : "attended",
    polls: isEs ? "Encuestas" : "Polls",
    responses: isEs ? "respuestas" : "responses",
    questions: isEs ? "Preguntas destacadas" : "Featured Q&A",
    answer: isEs ? "Respuesta:" : "Answer:",
    photos: isEs ? "Fotos" : "Photos",
    calendar: isEs ? "📅 Próximos Eventos" : "📅 Mark Your Calendar",
  };

  const presidentMessage = isEs
    ? newsletter.presidentMessageEs
    : newsletter.presidentMessageEn;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Back */}
      <Link
        href="/newsletter"
        className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.back}
      </Link>

      {/* Header */}
      <div className="mb-10">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">
          HOEP
        </p>
        <h1 className="text-4xl font-display font-bold text-neutral-900">
          {monthName} {newsletter.year}
        </h1>
      </div>

      {/* President's message */}
      {presidentMessage && (
        <div className="bg-amber-50 border-l-4 border-primary p-6 rounded-r-2xl mb-10">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">
            {t.from}
          </p>
          <p className="text-neutral-800 leading-relaxed">{presidentMessage}</p>
        </div>
      )}

      {/* Event recaps */}
      {content.eventRecaps.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-neutral-900 border-b border-neutral-200 pb-3 mb-6">
            {t.recaps}
          </h2>
          <div className="space-y-10">
            {content.eventRecaps.map((recap) => (
              <div key={recap.eventId}>
                <h3 className="text-xl font-bold text-neutral-900 mb-1">
                  {isEs ? recap.titleEs : recap.titleEn}
                </h3>
                <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(recap.date).toLocaleDateString(
                      isEs ? "es-MX" : "en-US",
                      { month: "long", day: "numeric", year: "numeric" },
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {recap.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {recap.attendanceCount} {t.attended}
                  </span>
                </div>

                {/* Photos */}
                {recap.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {recap.photos.slice(0, 6).map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square rounded-lg overflow-hidden"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || "Event photo"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Polls */}
                {recap.polls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {t.polls}
                    </p>
                    <div className="space-y-2">
                      {recap.polls.map((poll) => (
                        <div
                          key={poll.id}
                          className="p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                        >
                          <p className="text-sm font-medium text-neutral-900 mb-1">
                            {isEs ? poll.questionEs : poll.questionEn}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {poll.totalResponses} {t.responses}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Q&A */}
                {recap.questions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      {t.questions}
                    </p>
                    <div className="space-y-2">
                      {recap.questions.map((q) => (
                        <div
                          key={q.id}
                          className="p-3 rounded-lg bg-green-50 border border-green-100"
                        >
                          <p className="text-sm font-medium text-neutral-900 mb-1">
                            {isEs ? q.questionEs : q.questionEn}
                          </p>
                          {(isEs ? q.answerEs : q.answerEn) && (
                            <p className="text-sm text-green-800">
                              <strong>{t.answer}</strong>{" "}
                              {isEs ? q.answerEs : q.answerEn}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mark your calendar */}
      {content.upcomingEvents.length > 0 && (
        <section>
          <h2 className="text-2xl font-display font-bold text-neutral-900 border-b border-neutral-200 pb-3 mb-6">
            {t.calendar}
          </h2>
          <div className="space-y-3">
            {content.upcomingEvents.map((event) => (
              <div
                key={event.eventId}
                className="flex items-center gap-4 p-4 rounded-xl border-l-4 border-primary bg-amber-50"
              >
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900">
                    {isEs ? event.titleEs : event.titleEn}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString(
                        isEs ? "es-MX" : "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
