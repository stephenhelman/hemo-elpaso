import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import ProfileEditForm from "@/components/portal/ProfileEditForm";
import { Lang } from "@/types";
import { portalProfilePageTranslation } from "@/translation/portalPages";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      contactProfile: true, // Changed from profile
      disorderProfile: true, // NEW: Patient's disorder info
      familyMembers: {
        include: {
          contactProfile: true, // NEW: Family member contact info
          disorderProfile: true, // NEW: Family member disorder info
        },
      },
    },
  });

  if (!patient) {
    redirect("/portal/register");
  }

  // Check if registration is complete
  if (!patient.registrationCompletedAt || !patient.contactProfile) {
    redirect("/portal/register");
  }

  const locale = ((await cookies()).get("locale")?.value as Lang) || "en";
  const t = portalProfilePageTranslation[locale];

  // Format patient data for ProfileEditForm
  const formattedPatient = {
    id: patient.id,
    email: patient.email,

    // Grace period info
    diagnosisGracePeriodEndsAt: patient.diagnosisGracePeriodEndsAt,

    // Emergency contact (stored on Patient)
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
    emergencyContactRelationship: patient.emergencyContactRelationship,

    // Contact Profile (always exists after registration)
    contactProfile: patient.contactProfile
      ? {
          id: patient.contactProfile.id,
          firstName: patient.contactProfile.firstName,
          lastName: patient.contactProfile.lastName,
          phone: patient.contactProfile.phone,
          dateOfBirth: patient.contactProfile.dateOfBirth,
          addressLine1: patient.contactProfile.addressLine1,
          addressLine2: patient.contactProfile.addressLine2,
          city: patient.contactProfile.city,
          state: patient.contactProfile.state,
          zipCode: patient.contactProfile.zipCode,
        }
      : null,

    // Disorder Profile (only if patient has condition)
    disorderProfile: patient.disorderProfile
      ? {
          id: patient.disorderProfile.id,
          condition: patient.disorderProfile.condition,
          severity: patient.disorderProfile.severity,
          dateOfDiagnosis: patient.disorderProfile.dateOfDiagnosis,
          treatingPhysician: patient.disorderProfile.treatingPhysician,
          specialtyPharmacy: patient.disorderProfile.specialtyPharmacy,
          diagnosisLetterUrl: patient.disorderProfile.diagnosisLetterUrl,
          diagnosisLetterKey: patient.disorderProfile.diagnosisLetterKey,
          diagnosisLetterUploadedAt:
            patient.disorderProfile.diagnosisLetterUploadedAt,
          diagnosisVerified: patient.disorderProfile.diagnosisVerified,
          diagnosisVerifiedBy: patient.disorderProfile.diagnosisVerifiedBy,
          diagnosisVerifiedAt: patient.disorderProfile.diagnosisVerifiedAt,
          diagnosisRejectedReason:
            patient.disorderProfile.diagnosisRejectedReason,
        }
      : null,

    // Family Members
    familyMembers: patient.familyMembers.map((member) => ({
      id: member.id,
      relationship: member.relationship,
      hasBleedingDisorder: member.hasBleedingDisorder,
      migrationEligibleAt: member.migrationEligibleAt,

      // Family Member Contact Profile
      contactProfile: member.contactProfile
        ? {
            id: member.contactProfile.id,
            firstName: member.contactProfile.firstName,
            lastName: member.contactProfile.lastName,
            dateOfBirth: member.contactProfile.dateOfBirth,
          }
        : null,

      // Family Member Disorder Profile (only if has condition)
      disorderProfile: member.disorderProfile
        ? {
            id: member.disorderProfile.id,
            condition: member.disorderProfile.condition,
            severity: member.disorderProfile.severity,
            dateOfDiagnosis: member.disorderProfile.dateOfDiagnosis,
            treatingPhysician: member.disorderProfile.treatingPhysician,
            specialtyPharmacy: member.disorderProfile.specialtyPharmacy,
            diagnosisLetterUrl: member.disorderProfile.diagnosisLetterUrl,
            diagnosisLetterKey: member.disorderProfile.diagnosisLetterKey,
            diagnosisLetterUploadedAt:
              member.disorderProfile.diagnosisLetterUploadedAt,
            diagnosisVerified: member.disorderProfile.diagnosisVerified,
            diagnosisVerifiedBy: member.disorderProfile.diagnosisVerifiedBy,
            diagnosisVerifiedAt: member.disorderProfile.diagnosisVerifiedAt,
            diagnosisRejectedReason:
              member.disorderProfile.diagnosisRejectedReason,
          }
        : null,
    })),
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          {t.heading}
        </h1>
        <p className="text-neutral-500">{t.subtitle}</p>
      </div>

      <ProfileEditForm patient={formattedPatient} locale={locale} />
    </div>
  );
}
