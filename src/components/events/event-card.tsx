"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/types";

interface EventCardProps {
  event: Event;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function EventCard({ event }: EventCardProps) {
  // isPast is derived from the current time — computed client-side only to
  // avoid a server/client hydration mismatch (new Date() differs between SSR
  // and the first client render).
  const [isPast, setIsPast] = useState(false);
  useEffect(() => {
    setIsPast(new Date(event.date) < new Date());
  }, [event.date]);

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-md transition-shadow group-hover:bg-accent/20">
        {/* Cover or gradient header */}
        <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
              {event.title}
            </CardTitle>
            {isPast && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Past
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pb-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            <span suppressHydrationWarning>{formatEventDate(event.date)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-3.5 shrink-0" />
            <span>
              {event._count.rsvps} attendee{event._count.rsvps !== 1 ? "s" : ""}
            </span>
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
              {event.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
