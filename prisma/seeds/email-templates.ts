import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedEmailTemplates() {
  const templates = [
    {
      type: "REGISTRATION_INFO_CONFIRMATION",
      name: "Registration Confirmation",
      subject: "Thanks for registering with HOEP",
      description: "Sent after someone submits Register for Information. Contains no health information. (Subject is set in code; this row is the catalogue entry.)",
      enabled: true,
      variables: ["patientName", "lang"],
    },
    {
      type: "EVENT_INVITATION",
      name: "Event Invitation",
      subject: "You're invited: {{eventTitle}}",
      description: "Sent by the board from an event's Invitations page to matched patients. Contains their personal RSVP link.",
      enabled: true,
      variables: ["patientName", "eventTitle", "eventDate", "location", "rsvpUrl", "lang"],
    },
    {
      type: "RSVP_CONFIRMATION",
      name: "RSVP Confirmation",
      subject: "RSVP confirmed: {{eventTitle}}",
      description: "Sent when an RSVP is made or changed. Includes the check-in QR code.",
      enabled: true,
      variables: ["patientName", "eventTitle", "eventDate", "location", "attendeeCount", "qrUrl", "lang"],
    },
    {
      type: "RSVP_REMINDER",
      name: "RSVP Reminder",
      subject: "Reminder: {{eventTitle}} is tomorrow",
      description: "Sent by the daily cron the day before an event. Reuses the same QR code.",
      enabled: true,
      variables: ["patientName", "eventTitle", "eventDate", "location", "attendeeCount", "qrUrl", "lang"],
    },
    {
      type: "RSVP_CANCELLATION",
      name: "RSVP Cancellation",
      subject: "RSVP cancelled: {{eventTitle}}",
      description: "Sent when an RSVP is cancelled.",
      enabled: true,
      variables: ["patientName", "eventTitle", "eventDate", "lang"],
    },
    {
      type: "CHECK_IN_CONFIRMATION",
      name: "Check-In Confirmation",
      subject: "Welcome to {{eventTitle}}! 🎉",
      description: "Sent when a patient checks in at an event",
      enabled: true,
      variables: [
        "patientName",
        "eventTitle",
        "eventDate",
        "eventTime",
        "location",
        "checkInTime",
        "liveEventUrl",
      ],
    },
    {
      type: "EVENT_PUBLISHED",
      name: "New Event Announcement",
      subject: "New Event: {{eventTitle}} 🌟",
      description: "Sent when a new event is published (optional broadcast)",
      enabled: false, // Default off, admin enables manually
      variables: [
        "patientName",
        "eventTitle",
        "eventDate",
        "eventTime",
        "location",
        "description",
        "eventSlug",
      ],
    },
    {
      type: "EVENT_CANCELLED",
      name: "Event Cancellation",
      subject: "Event Cancelled: {{eventTitle}}",
      description: "Sent when an event is cancelled to all RSVPed attendees",
      enabled: true,
      variables: [
        "patientName",
        "eventTitle",
        "eventDate",
        "cancellationReason",
      ],
    },
    {
      type: "BOARD_ROLE_ASSIGNED",
      name: "Board Role - Onboarding",
      subject: "Your Board Role at HOEP: {{roleTitle}}",
      description: "Sent to a new board member when they are assigned a role. Bilingual — respects patient.preferredLanguage.",
      enabled: true,
      variables: ["patientName", "roleTitle", "roleEmail", "dashboardUrl", "lang"],
    },
  ];

  for (const template of templates) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.emailTemplate.upsert as any)({
      where: { type: template.type },
      update: template,
      create: template,
    });
  }

  console.log("✅ Seeded email templates");
}
