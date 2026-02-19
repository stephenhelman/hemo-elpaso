import Link from "next/link";
import { prisma } from "@/lib/db";
import { Sparkles, ArrowRight } from "lucide-react";

interface Props {
  patientId: string;
}

export default async function LiveEventBanner({ patientId }: Props) {
  // Get events the patient is checked into that are live now
  const now = new Date();

  const liveCheckIns = await prisma.checkIn.findMany({
    where: {
      patientId,
      event: {
        liveEnabled: true,
        eventDate: {
          // Event is today (within 24 hours before/after)
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    },
    include: {
      event: {
        select: {
          id: true,
          slug: true,
          titleEn: true,
          titleEs: true,
          eventDate: true,
          location: true,
        },
      },
    },
    orderBy: {
      checkInTime: "desc",
    },
  });

  if (liveCheckIns.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {liveCheckIns.map((checkIn) => (
        <Link
          key={checkIn.id}
          href={`/events/${checkIn.event.slug}/live`}
          className="block group"
        >
          <div className="p-6 rounded-2xl bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white/90 text-xs font-semibold uppercase tracking-wide">
                      Live Now
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-white text-xl mb-1">
                    {checkIn.event.titleEn}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {new Date(checkIn.event.eventDate).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      },
                    )}{" "}
                    • {checkIn.event.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-white group-hover:translate-x-1 transition-transform">
                <span className="hidden sm:inline text-sm font-semibold">
                  Join Live Event
                </span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
