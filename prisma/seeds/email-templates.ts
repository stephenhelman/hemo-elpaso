import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedEmailTemplates() {
  const templates = [
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
