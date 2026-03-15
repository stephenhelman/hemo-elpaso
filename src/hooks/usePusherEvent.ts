"use client";

import { useEffect } from "react";
import { getPusherClient, eventChannel } from "@/lib/pusher-client";
import type { PusherEvent } from "@/lib/pusher-server";

/**
 * Subscribe to one or more Pusher events on an event channel.
 *
 * Usage:
 *   usePusherEvent(eventId, "slide-changed", (data) => {
 *     setPresentation(data.presentation);
 *   });
 */
export function usePusherEvent(
  eventId: string,
  event: PusherEvent | PusherEvent[],
  handler: (data: any) => void,
) {
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(eventChannel(eventId));
    const events = Array.isArray(event) ? event : [event];

    events.forEach((e) => channel.bind(e, handler));

    return () => {
      events.forEach((e) => channel.unbind(e, handler));
      // Only unsubscribe if no other listeners remain
      if (Object.keys(channel.callbacks._callbacks ?? {}).length === 0) {
        pusher.unsubscribe(eventChannel(eventId));
      }
    };
  }, [eventId]);
}
