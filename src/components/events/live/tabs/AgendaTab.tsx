"use client";

import { ClipboardList, MapPin, Clock, Megaphone } from "lucide-react";

interface ItineraryItem {
  id: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  startTime: string;
  endTime: string | null;
  status: string;
  sequenceOrder: number;
  location: string | null;
}

interface Announcement {
  id: string;
  messageEn: string;
  messageEs: string;
  priority: string;
  createdAt: string;
}

interface Props {
  itinerary: ItineraryItem[];
  announcements: Announcement[];
  lang: "en" | "es";
}

export default function AgendaTab({ itinerary, announcements, lang }: Props) {
  const isEs = lang === "es";

  const statusConfig = {
    current: {
      ring: "ring-2 ring-primary",
      bg: "bg-primary/10",
      dot: "bg-green-500 animate-pulse",
      label: isEs ? "Ahora" : "Now",
    },
    completed: {
      ring: "",
      bg: "bg-neutral-800/40",
      dot: "bg-neutral-600",
      label: isEs ? "Completado" : "Done",
    },
    skipped: {
      ring: "",
      bg: "bg-neutral-800/20",
      dot: "bg-neutral-700",
      label: isEs ? "Omitido" : "Skipped",
    },
    scheduled: {
      ring: "",
      bg: "bg-neutral-800/60",
      dot: "bg-neutral-500",
      label: isEs ? "Próximo" : "Up next",
    },
  };

  return (
    <div className="space-y-4">
      {/* Announcements banner */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-3 p-4 rounded-xl ${
                a.priority === "urgent"
                  ? "bg-red-900/40 border border-red-500/40"
                  : a.priority === "info"
                    ? "bg-blue-900/40 border border-blue-500/40"
                    : "bg-primary-900/40 border border-primary-500/40"
              }`}
            >
              <Megaphone
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  a.priority === "urgent"
                    ? "text-red-400"
                    : a.priority === "info"
                      ? "text-blue-400"
                      : "text-primary-400"
                }`}
              />
              <p className="text-white text-sm leading-relaxed">
                {isEs ? a.messageEs : a.messageEn}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Itinerary */}
      {itinerary.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">
            {isEs ? "No hay agenda disponible." : "No agenda available yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {itinerary.map((item) => {
            const config =
              statusConfig[item.status as keyof typeof statusConfig] ??
              statusConfig.scheduled;
            const isCompleted =
              item.status === "completed" || item.status === "skipped";

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl ${config.bg} ${config.ring} transition-all`}
              >
                <div className="flex items-start gap-3">
                  {/* Status dot */}
                  <div className="mt-1.5 shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className={`font-semibold ${
                          isCompleted
                            ? "text-neutral-500 line-through"
                            : "text-white"
                        }`}
                      >
                        {isEs ? item.titleEs : item.titleEn}
                      </p>
                      {item.status === "current" && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                          {config.label}
                        </span>
                      )}
                    </div>

                    {(isEs ? item.descriptionEs : item.descriptionEn) &&
                      !isCompleted && (
                        <p className="text-neutral-400 text-sm mb-2">
                          {isEs ? item.descriptionEs : item.descriptionEn}
                        </p>
                      )}

                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.startTime).toLocaleTimeString(
                          isEs ? "es-MX" : "en-US",
                          { hour: "numeric", minute: "2-digit" },
                        )}
                        {item.endTime && (
                          <>
                            {" — "}
                            {new Date(item.endTime).toLocaleTimeString(
                              isEs ? "es-MX" : "en-US",
                              { hour: "numeric", minute: "2-digit" },
                            )}
                          </>
                        )}
                      </span>
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
