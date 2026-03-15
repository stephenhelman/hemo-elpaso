import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import NewsletterDraftClient from "./NewsletterDraftClient";

interface Props {
  params: { id: string };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default async function NewsletterDraftPage({ params }: Props) {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { boardRoles: true },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const newsletter = await prisma.newsletter.findUnique({
    where: { id: params.id },
  });

  if (!newsletter) notFound();

  const isPresident = admin.boardRoles.some(
    (r) => r.role === "PRESIDENT" && r.active,
  );

  return (
    <NewsletterDraftClient
      newsletter={{
        id: newsletter.id,
        month: newsletter.month,
        year: newsletter.year,
        monthName: MONTH_NAMES[newsletter.month - 1],
        status: newsletter.status,
        revisionNotes: newsletter.revisionNotes,
        generatedContentJson: newsletter.generatedContentJson as any,
      }}
      isPresident={isPresident}
      adminEmail={admin.email}
    />
  );
}
