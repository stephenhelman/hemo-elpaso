import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import EventStatsOverview from "@/components/admin/stats/EventStatsOverview";
import PollResultsExport from "@/components/admin/stats/PollResultsExport";
import QandAExport from "@/components/admin/stats/QandAExport";
import AttendanceBreakdown from "@/components/admin/stats/AttendanceBreakdown";
import { headers } from "next/headers";
import ExportAllButton from "@/components/admin/stats/ExportAllButton";
import AttendeeListExport from "@/components/admin/stats/AttendeeListExport";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";

interface Props {
  params: { id: string };
}

export default async function EventStatsPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewEventStats")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;

  // Fetch event with all engagement data
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      rsvps: true,
      checkIns: {
        include: {
          patient: {
            include: {
              contactProfile: true,
            },
          },
        },
      },
      polls: {
        include: {
          options: true,
        },
      },
      questions: true,
      announcements: true,
      itineraryItems: true,
    },
  });

  if (!event) notFound();

  const attendeesForExport = event.checkIns.map((checkIn) => ({
    id: checkIn.id,
    firstName: checkIn.patient.contactProfile?.firstName || "Unknown",
    lastName: checkIn.patient.contactProfile?.lastName || "User",
    email: checkIn.patient.email,
    phone: checkIn.patient.contactProfile?.phone || null,
    checkInTime: checkIn.checkInTime,
    attendeeRole: checkIn.attendeeRole,
  }));

  const headersList = headers();
  const referer = headersList.get("referer") || "";
  const cameFromEvents =
    referer.includes("/admin/events") && !referer.includes("/admin/events/");

  // Calculate stats
  const totalRsvps = event.rsvps.length;
  const patientCheckIns = event.checkIns.filter(
    (c) => c.attendeeRole === "patient",
  );
  const sponsorCheckIns = event.checkIns.filter(
    (c) => c.attendeeRole === "sponsor",
  );
  const donorCheckIns = event.checkIns.filter(
    (c) => c.attendeeRole === "donor",
  );
  const volunteerCheckIns = event.checkIns.filter(
    (c) => c.attendeeRole === "volunteer",
  );

  const attendanceRate =
    totalRsvps > 0
      ? Math.round((patientCheckIns.length / totalRsvps) * 100)
      : 0;

  const totalQuestions = event.questions.length;
  const answeredQuestions = event.questions.filter((q) => q.answered).length;

  // Calculate poll response counts manually
  const pollsWithCounts = await Promise.all(
    event.polls.map(async (poll) => {
      const responses = await prisma.pollResponse.count({
        where: { pollId: poll.id },
      });

      const optionsWithCounts = await Promise.all(
        poll.options.map(async (option) => {
          const optionResponses = await prisma.pollResponse.count({
            where: {
              pollId: poll.id,
              selectedOptionId: option.id,
            },
          });

          return {
            ...option,
            _count: {
              responses: optionResponses,
            },
          };
        }),
      );

      return {
        ...poll,
        _count: {
          responses,
        },
        options: optionsWithCounts,
      };
    }),
  );

  const totalPollResponses = pollsWithCounts.reduce(
    (sum, p) => sum + p._count.responses,
    0,
  );
  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <Link
        href={
          cameFromEvents ? "/admin/events" : `/admin/events/${event.id}/edit`
        }
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {cameFromEvents ? "Back to Events" : "Back to Event"}
      </Link>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Event Statistics
          </h1>
          <p className="text-neutral-600">{event.titleEn}</p>
          <p className="text-sm text-neutral-500 mt-1">
            {new Date(event.eventDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <ExportAllButton
          eventSlug={event.slug}
          eventTitle={event.titleEn}
          eventId={event.id}
          totalRsvps={totalRsvps}
          patientAttendance={patientCheckIns.length}
          sponsorCount={sponsorCheckIns.length}
          donorCount={donorCheckIns.length}
          volunteerCount={volunteerCheckIns.length}
          attendanceRate={attendanceRate}
          polls={pollsWithCounts}
          questions={event.questions}
        />
      </div>

      {/* Overview Stats */}
      <EventStatsOverview
        totalRsvps={totalRsvps}
        patientAttendance={patientCheckIns.length}
        attendanceRate={attendanceRate}
        totalQuestions={totalQuestions}
        answeredQuestions={answeredQuestions}
        totalPollResponses={totalPollResponses}
        locale={locale}
      />

      {/* Attendance Breakdown by Role */}
      <AttendanceBreakdown
        patientCount={patientCheckIns.length}
        sponsorCount={sponsorCheckIns.length}
        donorCount={donorCheckIns.length}
        volunteerCount={volunteerCheckIns.length}
        locale={locale}
      />

      {/* Attendee Contact List */}
      <AttendeeListExport
        eventSlug={event.slug}
        eventTitle={event.titleEn}
        attendees={attendeesForExport}
      />

      {/* Poll Results - PHI Free */}
      <PollResultsExport
        eventId={event.id}
        eventSlug={event.slug}
        eventTitle={event.titleEn}
        polls={pollsWithCounts}
      />

      {/* Q&A Export - PHI Free */}
      <QandAExport
        eventId={event.id}
        eventSlug={event.slug}
        eventTitle={event.titleEn}
        questions={event.questions}
      />
    </div>
  );
}
