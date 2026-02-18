"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface Event {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  eventDate: string;
  location: string;
  maxCapacity: number | null;
  status: string;
  _count: {
    rsvps: number;
  };
}

interface EventsContextType {
  upcomingEvents: Event[];
  pastEvents: Event[];
  loading: boolean;
  refetch: () => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      setUpcomingEvents(data.upcoming || []);
      setPastEvents(data.past || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const refetch = () => {
    setLoading(true);
    fetchEvents();
  };

  return (
    <EventsContext.Provider
      value={{ upcomingEvents, pastEvents, loading, refetch }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error("useEvents must be used within EventsProvider");
  }
  return context;
}
