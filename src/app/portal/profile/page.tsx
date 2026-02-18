import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ProfileEditForm from "@/components/portal/ProfileEditForm";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      profile: true,
      familyMembers: true,
    },
  });

  if (!patient) {
    redirect("/portal/register");
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            My Profile
          </h1>
          <p className="text-neutral-500">
            Update your personal information and preferences
          </p>
        </div>

        <ProfileEditForm patient={patient} />
      </div>
    </div>
  );
}
