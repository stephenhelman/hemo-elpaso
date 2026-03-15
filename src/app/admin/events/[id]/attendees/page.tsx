import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle, XCircle } from "lucide-react";
import ManualCheckInButton from "@/components/admin/ManualCheckInButton";
import { StatCard } from "@/components/ui/StatCard";

interface Props {
  params: { id: string };
}

export default async function EventAttendeesPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewPHI")) redirect("/admin/dashboard");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      rsvps: {
        include: {
          patient: {
            include: {
              contactProfile: true,
            },
          },
        },
        orderBy: {
          rsvpDate: "desc",
        },
      },
      checkIns: {
        include: {
          patient: {
            include: {
              contactProfile: true,
            },
          },
        },
      },
    },
  });

  if (!event) notFound();

  const totalRsvps = event.rsvps.length;
  const totalCheckedIn = event.checkIns.length;
  const notCheckedIn = event.rsvps.filter(
    (rsvp) => !event.checkIns.find((c) => c.patientId === rsvp.patientId),
  );

  const ageGroups = {
    "0-17": 0,
    "18+": 0,
  };

  const now = new Date();

  const allPatients = event.rsvps.map((rsvp) => rsvp.patient);

  allPatients.forEach((patient) => {
    if (!patient.contactProfile?.dateOfBirth) return;

    const age = Math.floor(
      (now.getTime() - new Date(patient.contactProfile.dateOfBirth).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000),
    );

    if (age <= 17) ageGroups["0-17"]++;
    else ageGroups["18+"]++;
  });

  const totalAdults = ageGroups["18+"];
  const totalChildren = ageGroups["0-17"];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            {event.titleEn}
          </h1>
          <p className="text-neutral-500">
            {new Date(event.eventDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total RSVPs"
            value={totalRsvps.toString()}
            color="primary"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Checked In"
            value={totalCheckedIn.toString()}
            color="green"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Adults"
            value={totalAdults.toString()}
            color="blue"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Children"
            value={totalChildren.toString()}
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Not Checked In */}
          <div className="bg-white rounded-2xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-neutral-900 text-xl">
                  Not Checked In ({notCheckedIn.length})
                </h2>
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {notCheckedIn.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-neutral-400">Everyone is checked in!</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {notCheckedIn.map((rsvp) => (
                    <AttendeeRow
                      key={rsvp.id}
                      rsvp={rsvp}
                      eventId={event.id}
                      isCheckedIn={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Checked In */}
          <div className="bg-white rounded-2xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="font-display font-bold text-neutral-900 text-xl">
                Checked In ({totalCheckedIn})
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {event.checkIns.length === 0 ? (
                <div className="p-8 text-center">
                  <XCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-400">No check-ins yet</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {event.checkIns.map((checkIn) => {
                    const rsvp = event.rsvps.find(
                      (r) => r.patientId === checkIn.patientId,
                    );
                    return (
                      <CheckedInRow
                        key={checkIn.id}
                        checkIn={checkIn}
                        rsvp={rsvp}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendeeRow({
  rsvp,
  eventId,
  isCheckedIn,
}: {
  rsvp: any;
  eventId: string;
  isCheckedIn: boolean;
}) {
  return (
    <div className="p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-neutral-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900">
              {rsvp.patient.contactProfile.firstName}{" "}
              {rsvp.patient.contactProfile.lastName}
            </p>
            <p className="text-sm text-neutral-500">
              {rsvp.adultsAttending} adult
              {rsvp.adultsAttending !== 1 ? "s" : ""}, {rsvp.childrenAttending}{" "}
              child{rsvp.childrenAttending !== 1 ? "ren" : ""}
            </p>
            {rsvp.dietaryRestrictions && (
              <p className="text-xs text-neutral-400 mt-1">
                🍽️ {rsvp.dietaryRestrictions}
              </p>
            )}
            <p className="text-xs text-neutral-400 mt-1">
              RSVP'd {new Date(rsvp.rsvpDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {!isCheckedIn && (
          <ManualCheckInButton
            rsvpId={rsvp.id}
            eventId={eventId}
            patientName={`${rsvp.patient.contactProfile.firstName} ${rsvp.patient.contactProfile.lastName}`}
          />
        )}
      </div>
    </div>
  );
}

function CheckedInRow({ checkIn, rsvp }: { checkIn: any; rsvp: any }) {
  return (
    <div className="p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900">
              {checkIn.patient.contactProfile.firstName}{" "}
              {checkIn.patient.contactProfile.lastName}
            </p>
            {rsvp && (
              <p className="text-sm text-neutral-500">
                {rsvp.adultsAttending} adult
                {rsvp.adultsAttending !== 1 ? "s" : ""},{" "}
                {rsvp.childrenAttending} child
                {rsvp.childrenAttending !== 1 ? "ren" : ""}
              </p>
            )}
            <p className="text-xs text-neutral-400 mt-1">
              Checked in{" "}
              {new Date(checkIn.checkInTime).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <ManualCheckInButton
          checkInId={checkIn.id}
          eventId={checkIn.eventId}
          patientName={`${checkIn.patient.contactProfile.firstName} ${checkIn.patient.contactProfile.lastName}`}
          isCheckedIn={true}
        />
      </div>
    </div>
  );
}
