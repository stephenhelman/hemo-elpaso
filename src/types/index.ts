import {
  PatientProfile,
  Rsvp,
  CheckIn,
  Event as EventProper,
  PatientPreferences,
} from "@prisma/client";

export interface Event {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  eventDate: string;
  location: string;
  maxAttendees?: number;
  rsvpDeadline?: string;
  status: "draft" | "published" | "live" | "completed" | "cancelled";
  targeting?: {
    targetConditions: string[];
    targetSeverity: string[];
    targetAgeGroups: string[];
    targetInterests: string[];
  };
}

interface PortalRsvp extends Rsvp {
  event: EventProper;
}

export interface PortalPatient {
  id: string;
  auth0Id: string;
  email: string;
  role: string;
  preferredLanguage: string;
  consentDate: Date | null;
  consentToContact: boolean;
  consentToPhotos: boolean;
  createdAt: Date;
  updatedAt: Date;
  diagnosisLetterUrl: string | null;
  diagnosisLetterKey: string | null;
  diagnosisLetterUploadedAt: Date | null;
  diagnosisVerified: boolean;
  diagnosisVerifiedBy: string | null;
  diagnosisVerifiedAt: Date | null;
  diagnosisRejectedReason: string | null;
  registrationCompletedAt: Date | null;
  diagnosisGracePeriodEndsAt: Date | null;
  profile: PatientProfile;
  preferences: PatientPreferences;
  rsvps: PortalRsvp[] | null;
  checkIns: CheckIn[] | null;
}

export interface Photo {
  id: string;
  eventId: string;
  cloudfrontUrl: string;
  captionEn?: string;
  captionEs?: string;
  approved: boolean;
}

export type Lang = "en" | "es";

export type StatColor =
  | "primary"
  | "blue"
  | "yellow"
  | "green"
  | "purple"
  | "amber"
  | "secondary"
  | "accent"
  | "indigo"
  | "teal";
