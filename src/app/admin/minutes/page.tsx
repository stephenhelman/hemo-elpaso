import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import MinutesIndexClient from "./MinutesIndexClient";

export default async function AdminMinutesPage() {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { boardRoles: true },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const minutes = await prisma.boardMinutes.findMany({
    orderBy: { meetingDate: "desc" },
  });

  const isSecretary =
    admin.boardRoles.some((r) => r.role === "SECRETARY" && r.active) ||
    admin.role === "admin";

  return (
    <MinutesIndexClient
      minutes={minutes.map((m) => ({
        id: m.id,
        title: m.title,
        meetingDate: m.meetingDate.toISOString(),
        isPublic: m.isPublic,
        markedPublicAt: m.markedPublicAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      }))}
      isSecretary={isSecretary}
    />
  );
}
