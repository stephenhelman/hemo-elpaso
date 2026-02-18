import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import EventEditForm from "@/components/admin/EventEditForm";

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
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Edit Event
          </h1>
          <p className="text-neutral-500">
            Update event details and targeting preferences
          </p>
        </div>

        <EventEditForm event={event} />
      </div>
    </div>
  );
}
