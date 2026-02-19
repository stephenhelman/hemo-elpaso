import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import EventEditForm from "@/components/admin/EventEditForm";
import { BarChart3, MessageSquare, Clock, Megaphone } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function EditEventPage({ params }: Props) {
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

  // Get event with targeting
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      targeting: true,
    },
  });

  if (!event) notFound();

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Edit Event
            </h1>
            <p className="text-neutral-500">
              Update event details and targeting preferences
            </p>
          </div>
          <div className="mb-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <p className="text-sm font-medium text-neutral-700 mb-3">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/events/${event.id}/itinerary`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                <Clock className="w-4 h-4" />
                Event Schedule
              </Link>

              <Link
                href={`/admin/events/${event.id}/announcements`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                <Megaphone className="w-4 h-4" />
                Announcements
              </Link>
              <Link
                href={`/admin/events/${event.id}/polls`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-purple-300 hover:text-purple-600 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Manage Polls
              </Link>

              <Link
                href={`/admin/events/${event.id}/questions`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Q&A Dashboard
              </Link>
            </div>
          </div>
        </div>

        <EventEditForm event={event} />
      </div>
    </div>
  );
}
