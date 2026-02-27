import {
  Rsvp,
  CheckIn,
  Event as EventProper,
  PatientPreferences,
  ContactProfile,
  DisorderProfile,
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
  registrationCompletedAt: Date | null;
  diagnosisGracePeriodEndsAt: Date | null;
  diagnosisGracePeriodSource: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  contactProfile: ContactProfile | null;
  disorderProfile: DisorderProfile | null;
  preferences: PatientPreferences | null;
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

export type PollOption = {
  textEn: string;
  textEs: string;
};
