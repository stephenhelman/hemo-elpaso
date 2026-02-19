import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ApplicationForm from "@/components/portal/assistance/ApplicationForm";

export default async function NewApplicationPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      profile: true,
    },
  });

  if (!patient) {
    redirect("/api/auth/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/portal/assistance"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            New Financial Assistance Application
          </h1>
          <p className="text-neutral-600">
            Complete the form below to request financial assistance
          </p>
        </div>

        <ApplicationForm patient={patient} />
      </div>
    </div>
  );
}
