import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { ArrowLeft, Plus, Send } from "lucide-react";
import Link from "next/link";
import PollsList from "@/components/polls/PollsList";
import CreatePollButton from "@/components/admin/polls/CreatePollButton";
import InviteRepButton from "@/components/admin/polls/InviteRepbutton";

interface Props {
  params: { id: string };
}

export default async function EventPollsPage({ params }: Props) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  // Check if user is admin/board
  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  // Get event with polls
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      interactions: {
        where: { type: "poll" },
        orderBy: { sequenceOrder: "asc" },
      },
    },
  });

  if (!event) notFound();

  // Count pending polls (from reps)
  const pendingCount = event.interactions.filter(
    (i) => i.status === "pending",
  ).length;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Link
          href={`/admin/events/${event.id}/edit`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Event Polls
            </h1>
            <p className="text-neutral-500 mb-2">{event.titleEn}</p>
            <p className="text-sm text-neutral-400">
              Create and manage live polls for this event
            </p>
          </div>

          <div className="flex gap-3">
            <InviteRepButton eventId={event.id} />
            <CreatePollButton eventId={event.id} />
          </div>
        </div>

        {/* Pending Polls Alert */}
        {pendingCount > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>{pendingCount}</strong> poll
              {pendingCount !== 1 ? "s" : ""} waiting for approval from reps
            </p>
          </div>
        )}

        {/* Polls List */}
        <PollsList
          eventId={event.id}
          polls={event.interactions}
          adminEmail={admin.email}
        />
      </div>
    </div>
  );
}
