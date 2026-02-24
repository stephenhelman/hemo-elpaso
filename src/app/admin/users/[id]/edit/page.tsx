import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import UserEditForm from "@/components/admin/users/UserEditForm";

interface Props {
  params: { id: string };
}

export default async function UserEditPage({ params }: Props) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const user = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      contactProfile: true,
    },
  });

  if (!user) notFound();

  return (
    <div className="p-4 md:p-8">
      <Link
        href={`/admin/users/${user.id}`}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to User Details
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          Edit User
        </h1>
        <p className="text-neutral-600">
          {user.contactProfile?.firstName} {user.contactProfile?.lastName}
        </p>
      </div>

      <UserEditForm user={user} />
    </div>
  );
}
