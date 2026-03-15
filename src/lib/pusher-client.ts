import PusherClient from "pusher-js";

// Client-side Pusher instance — singleton to avoid multiple connections
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClient;
}

// Channel name — must match server side
export const eventChannel = (eventId: string) => `event-${eventId}`;
