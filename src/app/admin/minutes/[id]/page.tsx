import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import MinutesDetailClient from "./MinutesDetailClient";

interface Props {
  params: { id: string };
}

export default async function AdminMinutesDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { boardRoles: true },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const minutes = await prisma.boardMinutes.findUnique({
    where: { id: params.id },
  });

  if (!minutes) notFound();

  const isSecretary =
    admin.boardRoles.some((r) => r.role === "SECRETARY" && r.active) ||
    admin.role === "admin";

  return (
    <MinutesDetailClient
      minutes={{
        id: minutes.id,
        title: minutes.title,
        meetingDate: minutes.meetingDate.toISOString(),
        content: minutes.content as any,
        isPublic: minutes.isPublic,
        markedPublicBy: minutes.markedPublicBy,
        markedPublicAt: minutes.markedPublicAt?.toISOString() ?? null,
        uploadedBy: minutes.uploadedBy,
        createdAt: minutes.createdAt.toISOString(),
      }}
      isSecretary={isSecretary}
    />
  );
}
