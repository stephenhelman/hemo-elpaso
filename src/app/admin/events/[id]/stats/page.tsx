import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  MessageSquare,
  BarChart3,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import EventStatsOverview from "@/components/admin/stats/EventStatsOverview";
import PollResultsExport from "@/components/admin/stats/PollResultsExport";
import QandAExport from "@/components/admin/stats/QandAExport";
import AttendanceBreakdown from "@/components/admin/stats/AttendanceBreakdown";
import { headers } from "next/headers";
import ExportAllButton from "@/components/admin/stats/ExportAllButton";
import AttendeeListExport from "@/components/admin/stats/AttendeeListExport";

interface Props {
  params: { id: string };
}

export default async function EventStatsPage({ params }: Props) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  // Fetch event with all engagement data
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      rsvps: true,
      checkIns: {
        include: {
          patient: {
            include: {
              profile: true,
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
    firstName: checkIn.patient.profile?.firstName || "Unknown",
    lastName: checkIn.patient.profile?.lastName || "User",
    email: checkIn.patient.email,
    phone: checkIn.patient.profile?.phone || null,
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
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
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
        />

        {/* Attendance Breakdown by Role */}
        <AttendanceBreakdown
          patientCount={patientCheckIns.length}
          sponsorCount={sponsorCheckIns.length}
          donorCount={donorCheckIns.length}
          volunteerCount={volunteerCheckIns.length}
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
    </div>
  );
}
