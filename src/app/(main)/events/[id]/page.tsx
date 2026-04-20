"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RSVPButton } from "@/components/events/rsvp-button";
import { api } from "@/lib/api";
import type { Event, RSVP } from "@/types";

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvent = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ event: Event }>(`/api/events/${id}`);
      setEvent(data.event);
    } catch {
      toast.error("Failed to load event");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  function handleRsvpChange(rsvp: RSVP | null) {
    if (!event) return;

    setEvent((prev) => {
      if (!prev) return prev;

      const hadRsvp = !!prev.userRsvp;
      const wasGoing = prev.userRsvp?.status === "GOING";
      const nowGoing = rsvp?.status === "GOING";

      let rsvpDelta = 0;
      if (!hadRsvp && rsvp) rsvpDelta = 1;
      else if (hadRsvp && !rsvp) rsvpDelta = -1;
      else if (wasGoing && !nowGoing) rsvpDelta = -1;
      else if (!wasGoing && nowGoing) rsvpDelta = 1;

      const updatedRsvps = rsvp
        ? prev.rsvps
          ? prev.rsvps.map((r) => (r.userId === rsvp.userId ? rsvp : r))
          : [rsvp]
        : (prev.rsvps ?? []).filter((r) => r.id !== prev.userRsvp?.id);

      return {
        ...prev,
        userRsvp: rsvp ?? undefined,
        rsvps: updatedRsvps,
        _count: {
          ...prev._count,
          rsvps: Math.max(0, prev._count.rsvps + rsvpDelta),
        },
      };
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Event not found.
      </div>
    );
  }

  // Compare against a stable reference — both sides are parsed from stored
  // ISO strings so the result is deterministic and won't cause a hydration
  // mismatch. `event.date` is a string from the API, not `Date.now()`.
  const isPast = new Date(event.date).getTime() < Date.now();
  const goingRsvps = (event.rsvps ?? []).filter((r) => r.status === "GOING");

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
      >
        <ArrowLeft className="size-4" />
        Back to Events
      </Link>

      {/* Hero section */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-tight">{event.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            {isPast && (
              <Badge variant="secondary">Past Event</Badge>
            )}
            <RSVPButton
              eventId={event.id}
              currentRsvp={event.userRsvp}
              onRsvpChange={handleRsvpChange}
            />
          </div>
        </div>

        {/* Event meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0" />
            <span suppressHydrationWarning>{formatEventDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4 shrink-0" />
            <span>
              {event._count.rsvps} attendee{event._count.rsvps !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Description */}
      {event.description && (
        <div className="space-y-2">
          <h2 className="font-semibold">About this Event</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {event.description}
          </p>
        </div>
      )}

      {/* Organizer */}
      <div className="rounded-xl border border-border p-4 space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Organizer
        </h2>
        <div className="flex items-center gap-3">
          <Link href={`/profile/${event.organizer.username}`}>
            <Avatar className="size-10">
              {event.organizer.avatarUrl && (
                <AvatarImage
                  src={event.organizer.avatarUrl}
                  alt={event.organizer.displayName}
                />
              )}
              <AvatarFallback>
                {getInitials(event.organizer.displayName)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link
              href={`/profile/${event.organizer.username}`}
              className="font-semibold text-sm hover:underline"
            >
              {event.organizer.displayName}
            </Link>
            <p className="text-xs text-muted-foreground">
              @{event.organizer.username}
            </p>
          </div>
        </div>
      </div>

      {/* Attendees */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <UserCircle2 className="size-5" />
          Attendees Going ({goingRsvps.length})
        </h2>

        {goingRsvps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one has RSVPd as going yet. Be the first!
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {goingRsvps.map((rsvp) =>
              rsvp.user ? (
                <Link
                  key={rsvp.id}
                  href={`/profile/${rsvp.user.username}`}
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 hover:bg-accent transition-colors"
                >
                  <Avatar className="size-6">
                    {rsvp.user.avatarUrl && (
                      <AvatarImage
                        src={rsvp.user.avatarUrl}
                        alt={rsvp.user.displayName}
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(rsvp.user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {rsvp.user.displayName}
                  </span>
                </Link>
              ) : null
            )}
          </div>
        )}
      </div>

    </div>
  );
}
