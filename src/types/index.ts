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
