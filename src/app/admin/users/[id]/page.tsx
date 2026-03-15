import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Award,
  AlertCircle,
} from "lucide-react"; // ADD AlertCircle
import Link from "next/link";
import DiagnosisVerificationStatus from "@/components/admin/DiagnosisVerificationStatus";
import { StatCard } from "@/components/ui/StatCard";
import { AuditAction } from "@prisma/client";

interface Props {
  params: { id: string };
}

export default async function patientDetailPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageUsers")) redirect("/admin/dashboard");

  // Fetch patient with full details
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      contactProfile: true,
      disorderProfile: true,
      rsvps: {
        include: {
          event: true,
        },
        orderBy: {
          rsvpDate: "desc",
        },
        take: 10,
      },
      checkIns: {
        include: {
          event: true,
        },
        orderBy: {
          checkInTime: "desc",
        },
        take: 10,
      },
      familyMembers: {
        include: {
          contactProfile: true,
          disorderProfile: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!patient) notFound();

  // ADD AUDIT LOG FOR VIEWING patient DETAILS
  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.PATIENT_VIEWED,
      resourceType: "Patient",
      resourceId: patient.id,
      details: `Viewed patient details: ${patient.contactProfile?.firstName} ${patient.contactProfile?.lastName}`,
    },
  });

  // Calculate stats
  const totalRsvps = await prisma.rsvp.count({
    where: { patientId: patient.id },
  });

  const totalCheckIns = await prisma.checkIn.count({
    where: { patientId: patient.id },
  });

  const attendanceRate =
    totalRsvps > 0 ? Math.round((totalCheckIns / totalRsvps) * 100) : 0;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <Link
        href="/admin/patients"
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to patients
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            {patient.contactProfile?.firstName}{" "}
            {patient.contactProfile?.lastName}
          </h1>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
              patient.role === "admin"
                ? "bg-purple-100 text-purple-800"
                : patient.role === "board"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
            }`}
          >
            {patient.role}
          </span>
        </div>

        <Link
          href={`/admin/users/${patient.id}/edit`}
          className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          Edit patient
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Total RSVPs"
          value={totalRsvps.toString()}
          color="blue"
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Events Attended"
          value={totalCheckIns.toString()}
          color="green"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & Medical */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-display font-bold text-neutral-900 mb-4">
              Contact Information
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-700">Email</p>
                  <p className="text-sm text-neutral-900">{patient.email}</p>
                </div>
              </div>

              {patient.contactProfile?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      Phone
                    </p>
                    <p className="text-sm text-neutral-900">
                      {patient.contactProfile.phone}
                    </p>
                  </div>
                </div>
              )}

              {patient.contactProfile?.city && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      Location
                    </p>
                    <p className="text-sm text-neutral-900">
                      {patient.contactProfile.addressLine1}
                      <br />
                      {patient.contactProfile.city},{" "}
                      {patient.contactProfile.state}{" "}
                      {patient.contactProfile.zipCode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ADD EMERGENCY CONTACT */}
          {patient.emergencyContactName && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-display font-bold text-red-900">
                  Emergency Contact
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-red-900">Name</p>
                  <p className="text-sm text-red-800">
                    {patient.emergencyContactName}
                  </p>
                </div>

                {patient.emergencyContactRelationship && (
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Relationship
                    </p>
                    <p className="text-sm text-red-800">
                      {patient.emergencyContactRelationship}
                    </p>
                  </div>
                )}

                {patient.emergencyContactPhone && (
                  <div>
                    <p className="text-sm font-medium text-red-900">Phone</p>
                    <p className="text-sm text-red-800 font-mono">
                      {patient.emergencyContactPhone}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-red-200">
                <p className="text-xs text-red-700">
                  ⚠️ For emergency use only
                </p>
              </div>
            </div>
          )}

          {/* Medical Information (for patients only) */}
          {patient.disorderProfile && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-display font-bold text-neutral-900 mb-4">
                Medical Information
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-neutral-700">
                    Primary Condition
                  </p>
                  <p className="text-sm text-neutral-900">
                    {patient.disorderProfile.condition}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-700">
                    Severity
                  </p>
                  <p className="text-sm text-neutral-900">
                    {patient.disorderProfile.severity}
                  </p>
                </div>

                {patient.contactProfile?.dateOfBirth && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      Date of Birth
                    </p>
                    <p className="text-sm text-neutral-900">
                      {new Date(
                        patient.contactProfile.dateOfBirth,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {patient.disorderProfile.dateOfDiagnosis && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      Diagnosis Date
                    </p>
                    <p className="text-sm text-neutral-900">
                      {new Date(
                        patient.disorderProfile.dateOfDiagnosis,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {patient.disorderProfile.treatingPhysician && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      Treating Physician
                    </p>
                    <p className="text-sm text-neutral-900">
                      {patient.disorderProfile.treatingPhysician}
                    </p>
                  </div>
                )}

                {patient.disorderProfile.specialtyPharmacy && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      Specialty Pharmacy
                    </p>
                    <p className="text-sm text-neutral-900">
                      {patient.disorderProfile.specialtyPharmacy}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Activity & Family */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent RSVPs */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-display font-bold text-neutral-900 mb-4">
              Recent RSVPs
            </h2>

            {patient.rsvps.length === 0 ? (
              <p className="text-neutral-500 text-sm">No RSVPs yet</p>
            ) : (
              <div className="space-y-3">
                {patient.rsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        {rsvp.event.titleEn}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {new Date(rsvp.event.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        rsvp.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : rsvp.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {rsvp.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Check-Ins */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-display font-bold text-neutral-900 mb-4">
              Recent Check-Ins
            </h2>

            {patient.checkIns.length === 0 ? (
              <p className="text-neutral-500 text-sm">No check-ins yet</p>
            ) : (
              <div className="space-y-3">
                {patient.checkIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        {checkIn.event.titleEn}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {new Date(checkIn.event.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">
                        {new Date(checkIn.checkInTime).toLocaleTimeString()}
                      </p>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                        {checkIn.attendeeRole}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Family Members - UPDATED WITH MORE DETAILS */}
          {patient.familyMembers.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-display font-bold text-neutral-900 mb-4">
                Family Members
              </h2>

              <div className="space-y-4">
                {patient.familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`p-4 rounded-lg border ${
                      member.hasBleedingDisorder
                        ? "bg-red-50 border-red-200"
                        : "bg-neutral-50 border-neutral-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-neutral-900">
                          {member.contactProfile?.firstName}{" "}
                          {member.contactProfile?.lastName}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {member.relationship}
                        </p>
                      </div>
                      {member.hasBleedingDisorder && (
                        <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
                          Has Bleeding Disorder
                        </span>
                      )}
                    </div>

                    {member.contactProfile?.dateOfBirth && (
                      <p className="text-sm text-neutral-600 mb-1">
                        DOB:{" "}
                        {new Date(
                          member.contactProfile.dateOfBirth,
                        ).toLocaleDateString()}
                      </p>
                    )}

                    {member.hasBleedingDisorder &&
                      member.disorderProfile?.condition && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="text-sm font-medium text-red-900 mb-1">
                            Medical Information:
                          </p>
                          <p className="text-sm text-red-800">
                            <strong>Condition:</strong>{" "}
                            {member.disorderProfile.condition}
                          </p>
                          {member.disorderProfile.severity && (
                            <p className="text-sm text-red-800">
                              <strong>Severity:</strong>{" "}
                              {member.disorderProfile.severity}
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  ℹ️ Medical information displayed for family members with
                  bleeding disorders to ensure proper event accommodations and
                  emergency preparedness.
                </p>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Diagnosis Verification Status
            </h2>

            {/* Patient's Diagnosis */}
            {patient.disorderProfile?.condition && (
              <div className="mb-4">
                <h3 className="font-medium text-neutral-700 mb-2">Patient</h3>
                <DiagnosisVerificationStatus
                  diagnosisLetterUrl={
                    patient.disorderProfile?.diagnosisLetterUrl ?? null
                  }
                  diagnosisVerified={
                    patient.disorderProfile?.diagnosisVerified ?? false
                  }
                  diagnosisVerifiedAt={
                    patient.disorderProfile?.diagnosisVerifiedAt ?? null
                  }
                  diagnosisRejectedReason={
                    patient.disorderProfile?.diagnosisRejectedReason ?? null
                  }
                  gracePeriodEndsAt={patient.diagnosisGracePeriodEndsAt}
                />
              </div>
            )}

            {/* Family Members with Bleeding Disorders */}
            {patient.familyMembers
              .filter((m) => m.hasBleedingDisorder)
              .map((member) => (
                <div
                  key={member.id}
                  className="mb-4 pt-4 border-t border-neutral-200"
                >
                  <h3 className="font-medium text-neutral-700 mb-2">
                    {member.contactProfile?.firstName}{" "}
                    {member.contactProfile?.lastName} ({member.relationship})
                  </h3>
                  <DiagnosisVerificationStatus
                    diagnosisLetterUrl={
                      member.disorderProfile?.diagnosisLetterUrl ?? null
                    }
                    diagnosisVerified={
                      member.disorderProfile?.diagnosisVerified ?? false
                    }
                    diagnosisVerifiedAt={
                      member.disorderProfile?.diagnosisVerifiedAt ?? null
                    }
                    diagnosisRejectedReason={
                      member.disorderProfile?.diagnosisRejectedReason ?? null
                    }
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
