import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import NewsletterIndexClient from "./NewsletterIndexClient";

export default async function NewsletterIndexPage() {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { boardRoles: true },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const newsletters = await prisma.newsletter.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const isPresident = admin.boardRoles.some(
    (r) => r.role === "PRESIDENT" && r.active,
  );

  return (
    <NewsletterIndexClient
      newsletters={newsletters.map((n) => ({
        id: n.id,
        month: n.month,
        year: n.year,
        status: n.status,
        sentAt: n.sentAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      }))}
      isPresident={isPresident}
    />
  );
}
