import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { User, Mail, Phone, MapPin, Calendar } from "lucide-react";

export default async function ProfilePage() {
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
    redirect("/portal/register");
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-8">
          My Profile
        </h1>

        <div className="bg-white rounded-2xl border border-neutral-200 p-8">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-neutral-200">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {patient.profile?.firstName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-neutral-900">
                {patient.profile?.firstName} {patient.profile?.lastName}
              </h2>
              <p className="text-neutral-500">{patient.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              icon={<Mail className="w-5 h-5" />}
              label="Email"
              value={patient.email}
            />
            <InfoField
              icon={<Phone className="w-5 h-5" />}
              label="Phone"
              value={patient.profile?.phone || "Not provided"}
            />
            <InfoField
              icon={<MapPin className="w-5 h-5" />}
              label="Address"
              value={`${patient.profile?.addressLine1 || ""} ${patient.profile?.city || ""}, ${patient.profile?.state || ""}`}
            />
            <InfoField
              icon={<Calendar className="w-5 h-5" />}
              label="Date of Birth"
              value={
                patient.profile?.dateOfBirth
                  ? new Date(patient.profile.dateOfBirth).toLocaleDateString()
                  : "Not provided"
              }
            />
          </div>

          <div className="mt-8 pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-500 text-center">
              Profile editing coming soon. Contact us at info@hemo-el-paso.org
              to update your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 font-medium">{label}</p>
        <p className="text-sm text-neutral-900 font-medium mt-1">{value}</p>
      </div>
    </div>
  );
}
