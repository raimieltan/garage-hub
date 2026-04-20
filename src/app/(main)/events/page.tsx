"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "@/components/events/event-card";
import { CreateEvent } from "@/components/events/create-event";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Event } from "@/types";

function EventSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="h-2 bg-muted" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ events: Event[] }>("/api/events");
      setEvents(data.events);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  function handleEventCreated(event: Event) {
    setEvents((prev) => [event, ...prev]);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Find and join car meets and events near you
          </p>
        </div>
        <CreateEvent onEventCreated={handleEventCreated} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <EventSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <CalendarDays className="size-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">No events yet. Be the first to create one!</p>
          <CreateEvent onEventCreated={handleEventCreated} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
