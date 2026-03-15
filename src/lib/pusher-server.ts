import Pusher from "pusher";

// Server-side Pusher instance — used in API routes to trigger events
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Channel name for a live event
export const eventChannel = (eventId: string) => `event-${eventId}`;

// All event types — single source of truth
export const PUSHER_EVENTS = {
  // Presentation
  SLIDE_CHANGED: "slide-changed",
  PRESENTATION_LIVE: "presentation-live",

  // Polls
  POLL_ACTIVATED: "poll-activated",
  POLL_DEACTIVATED: "poll-deactivated",
  POLL_VOTE: "poll-vote",

  // Q&A
  QUESTION_ADDED: "question-added",
  QUESTION_ANSWERED: "question-answered",
  QUESTION_UPVOTED: "question-upvoted",

  // Photos
  PHOTO_APPROVED: "photo-approved",

  // Agenda & Announcements
  ITINERARY_UPDATED: "itinerary-updated",
  ANNOUNCEMENT_ADDED: "announcement-added",
} as const;

export type PusherEvent = (typeof PUSHER_EVENTS)[keyof typeof PUSHER_EVENTS];
