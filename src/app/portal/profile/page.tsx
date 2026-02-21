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

  const formattedPatient = {
    id: patient.id,
    email: patient.email,
    // ADD THESE DIAGNOSIS FIELDS
    diagnosisLetterUrl: patient.diagnosisLetterUrl,
    diagnosisLetterKey: patient.diagnosisLetterKey,
    diagnosisLetterUploadedAt: patient.diagnosisLetterUploadedAt,
    diagnosisVerified: patient.diagnosisVerified,
    diagnosisVerifiedBy: patient.diagnosisVerifiedBy,
    diagnosisVerifiedAt: patient.diagnosisVerifiedAt,
    diagnosisRejectedReason: patient.diagnosisRejectedReason,
    registrationCompletedAt: patient.registrationCompletedAt,
    diagnosisGracePeriodEndsAt: patient.diagnosisGracePeriodEndsAt,

    profile: patient.profile,
    familyMembers: patient.familyMembers.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: member.dateOfBirth,
      relationship: member.relationship,
      hasBleedingDisorder: member.hasBleedingDisorder,
      condition: member.condition || "",
      severity: member.severity || "",
      // ADD THESE DIAGNOSIS FIELDS FOR FAMILY MEMBERS
      diagnosisLetterUrl: member.diagnosisLetterUrl,
      diagnosisLetterKey: member.diagnosisLetterKey,
      diagnosisLetterUploadedAt: member.diagnosisLetterUploadedAt,
      diagnosisVerified: member.diagnosisVerified,
      diagnosisVerifiedBy: member.diagnosisVerifiedBy,
      diagnosisVerifiedAt: member.diagnosisVerifiedAt,
      diagnosisRejectedReason: member.diagnosisRejectedReason,
    })),
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            My Profile
          </h1>
          <p className="text-neutral-500">
            Update your personal information and preferences
          </p>
        </div>

        <ProfileEditForm patient={formattedPatient} />
      </div>
    </div>
  );
}
