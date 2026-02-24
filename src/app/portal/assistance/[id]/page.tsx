import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { Lang } from "@/types";
import AssistanceDetailContent from "@/components/portal/assistance/AssistanceDetailContent";

interface Props {
  params: { id: string };
}

export default async function ApplicationDetailPage({ params }: Props) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!patient) {
    redirect("/api/auth/login");
  }

  const application = await prisma.financialAssistanceApplication.findUnique({
    where: { id: params.id },
    include: {
      documents: true,
      disbursements: true,
    },
  });

  if (!application || application.patientId !== patient.id) {
    notFound();
  }

  const locale = ((await cookies()).get("locale")?.value as Lang) || "en";

  return <AssistanceDetailContent application={application} locale={locale} />;
}
