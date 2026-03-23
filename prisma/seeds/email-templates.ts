import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedEmailTemplates() {
  const templates = [
    {
      type: "RSVP_CONFIRMATION",
      name: "RSVP Confirmation",
      subject: "You're Registered for {{eventTitle}}! 🎉",
      description: "Sent when a patient successfully RSVPs to an event",
      enabled: true,
      variables: [
        "patientName",
        "eventTitle",
        "eventDate",
        "eventTime",
        "location",
        "adultsCount",
        "childrenCount",
        "qrCodeDataUrl",
        "eventSlug",
      ],
    },
    {
      type: "RSVP_CANCELLATION",
      name: "RSVP Cancellation",
      subject: "RSVP Cancelled: {{eventTitle}}",
      description: "Sent when a patient cancels their RSVP",
      enabled: true,
      variables: [
        "patientName",
        "eventTitle",
        "eventDate",
        "eventTime",
        "eventSlug",
      ],
    },
    {
      type: "RSVP_REMINDER",
      name: "Event Reminder",
      subject: "Tomorrow: {{eventTitle}} at {{eventTime}} 📅",
      description: "Sent 1 day before the event to confirmed attendees",
      enabled: true,
      variables: [
        "patientName",
        "eventTitle",
        "eventDate",
        "eventTime",
        "location",
        "adultsCount",
        "childrenCount",
        "qrCodeDataUrl",
        "eventSlug",
      ],
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
      type: "ASSISTANCE_SUBMITTED",
      name: "Financial Assistance - Application Submitted",
      subject: "We Received Your Financial Assistance Application",
      description:
        "Sent when a patient submits a financial assistance application",
      enabled: true,
      variables: [
        "patientName",
        "assistanceType",
        "requestedAmount",
        "applicationId",
      ],
    },
    {
      type: "ASSISTANCE_APPROVED",
      name: "Financial Assistance - Approved",
      subject: "Your Financial Assistance Application Was Approved! ✅",
      description: "Sent when a financial assistance application is approved",
      enabled: true,
      variables: [
        "patientName",
        "assistanceType",
        "requestedAmount",
        "approvedAmount",
        "reviewNotes",
        "applicationId",
      ],
    },
    {
      type: "ASSISTANCE_DENIED",
      name: "Financial Assistance - Denied",
      subject: "Update on Your Financial Assistance Application",
      description: "Sent when a financial assistance application is denied",
      enabled: true,
      variables: [
        "patientName",
        "assistanceType",
        "requestedAmount",
        "reviewNotes",
        "applicationId",
      ],
    },
    {
      type: "DISBURSEMENT_ISSUED",
      name: "Financial Assistance - Disbursement Issued",
      subject: "Your Financial Assistance Payment is On the Way! 💰",
      description: "Sent when a disbursement is created/check is issued",
      enabled: true,
      variables: [
        "patientName",
        "assistanceType",
        "amount",
        "paymentMethod",
        "checkNumber",
        "expectedDate",
      ],
    },
    {
      type: "WELCOME_EMAIL",
      name: "Welcome to HOEP",
      subject: "Welcome to Hemophilia Outreach of El Paso! 👋",
      description: "Sent when a new patient registers",
      enabled: true,
      variables: ["patientName", "portalUrl"],
    },
    {
      type: "VOLUNTEER_REQUEST_RECEIVED",
      name: "Volunteer Request - Received",
      subject: "We Received Your Volunteer Request!",
      description: "Sent to the patient when they submit a volunteer request",
      enabled: true,
      variables: ["patientName", "submittedAt"],
    },
    {
      type: "VOLUNTEER_REQUEST_NOTIFY",
      name: "Volunteer Request - Admin Notification",
      subject: "New Volunteer Request from {{patientName}}",
      description: "Sent to admins when a new volunteer request is submitted",
      enabled: true,
      variables: ["patientName", "patientEmail", "submittedAt", "reviewUrl"],
    },
    {
      type: "VOLUNTEER_APPROVED",
      name: "Volunteer - Approved",
      subject: "You're Approved as a HOEP Volunteer! 🎉",
      description: "Sent to the patient when their volunteer request is approved",
      enabled: true,
      variables: ["patientName"],
    },
    {
      type: "VOLUNTEER_ASSIGNED",
      name: "Volunteer - Event Assignment",
      subject: "You've Been Assigned to {{eventTitle}}",
      description: "Sent when a volunteer is assigned to a specific event",
      enabled: true,
      variables: ["patientName", "eventTitle", "eventDate", "eventTime", "location", "role", "accessToken"],
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
