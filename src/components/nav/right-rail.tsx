"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, MapPin, Users, Wrench } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { CarClub, Event as EventType, Post } from "@/types";

type RailClub = CarClub & { memberCount?: number };

function SectionHeader({
  index,
  label,
  title,
  href,
}: {
  index: string;
  label: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="pit-index">
        <span className="pit-index__num">{index}</span>
        <span>{label}</span>
        <span className="pit-index__rule" />
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-[10px] tracking-[0.22em] text-muted-foreground transition hover:text-primary"
          >
            All
            <ArrowUpRight className="size-3" />
          </Link>
        ) : null}
      </div>
      <h3 className="font-display text-[22px] leading-tight italic text-foreground">
        {title}
      </h3>
    </div>
  );
}

function SkeletonRow({ lines = 2 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card/50 p-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3 animate-pulse rounded-sm bg-muted",
            i === 0 ? "w-3/4" : "w-1/2"
          )}
        />
      ))}
    </div>
  );
}

function formatEventDate(iso: string): { day: string; month: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "--", month: "---", time: "" };
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return { day, month, time };
}

export function RightRail() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EventType[]>([]);
  const [clubs, setClubs] = useState<RailClub[]>([]);
  const [builds, setBuilds] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [eventsRes, clubsRes, buildsRes] = await Promise.all([
          api.get<{ events: EventType[] }>("/api/events?limit=3"),
          api.get<{ clubs: RailClub[] }>("/api/clubs?limit=4"),
          api.get<{ posts: Post[] }>("/api/posts?type=BUILD_UPDATE&limit=3"),
        ]);
        if (cancelled) return;
        setEvents(eventsRes.events ?? []);
        setClubs(clubsRes.clubs ?? []);
        setBuilds(buildsRes.posts ?? []);
      } catch {
        if (!cancelled) {
          setEvents([]);
          setClubs([]);
          setBuilds([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-7 pb-10">
      {/* Section 01 — Upcoming Meets */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          index="01"
          label="Upcoming"
          title="On the grid"
          href="/events"
        />
        <div className="flex flex-col gap-2">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              No meets on the calendar.
            </div>
          ) : (
            events.map((ev) => {
              const { day, month, time } = formatEventDate(ev.date);
              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="group relative flex items-start gap-3 overflow-hidden rounded-lg border border-border/60 bg-card p-3 transition hover:border-primary/40 hover:bg-card/80"
                >
                  <div className="flex shrink-0 flex-col items-center justify-center rounded-md border border-border bg-background px-2.5 py-1.5 leading-none">
                    <span className="font-mono text-[9px] tracking-[0.2em] text-accent">
                      {month}
                    </span>
                    <span className="font-display text-2xl text-foreground">
                      {day}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-semibold text-foreground">
                      {ev.title}
                    </div>
                    <div className="mt-1 flex items-center gap-1 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] font-mono tracking-[0.18em] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {time}
                      </span>
                      <span className="tabular-nums">
                        RSVP · {ev._count?.rsvps ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Section 02 — Hot clubs */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          index="02"
          label="Paddock"
          title="Hot clubs"
          href="/clubs"
        />
        <div className="flex flex-col gap-1">
          {loading ? (
            <>
              <div className="h-10 animate-pulse rounded-lg bg-muted/60" />
              <div className="h-10 animate-pulse rounded-lg bg-muted/40" />
              <div className="h-10 animate-pulse rounded-lg bg-muted/30" />
            </>
          ) : clubs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
              No clubs yet.
            </div>
          ) : (
            clubs.map((club, idx) => {
              const count =
                club.memberCount ?? club._count?.memberships ?? 0;
              return (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-muted"
                >
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60 w-5">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    {club.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={club.coverImage}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full bg-gradient-to-br from-accent/30 via-transparent to-primary/20" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {club.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <Users className="size-3" />
                      <span className="tabular-nums">{count}</span>
                      <span>members</span>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Section 03 — Fresh builds */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          index="03"
          label="Builds"
          title="Fresh wrench"
          href="/feed?type=BUILD_UPDATE"
        />
        <div className="flex flex-col gap-2">
          {loading ? (
            <>
              <SkeletonRow lines={3} />
              <SkeletonRow lines={3} />
            </>
          ) : builds.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
              Nobody&rsquo;s wrenching today.
            </div>
          ) : (
            builds.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group relative flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card p-3 transition hover:border-accent/40"
              >
                <div className="flex items-center gap-2">
                  <span className="signal-chip">BUILD</span>
                  <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    @{post.author.username}
                  </span>
                </div>
                {post.car ? (
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {post.car.year} {post.car.make} {post.car.model}
                  </div>
                ) : null}
                <p className="line-clamp-3 text-sm text-foreground/90">
                  {post.content}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[10px] font-mono tracking-[0.18em] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Wrench className="size-3" />
                    {post._count.comments}
                  </span>
                  <span className="tabular-nums">
                    {post._count.likes} ignitions
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="mt-2">
        <div className="pit-index px-1">
          <span className="pit-index__num">04</span>
          <span className="pit-index__rule" />
          <span>
            {isAuthenticated ? "LIVE · Authenticated" : "GUEST · Read-only"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 px-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60">
          <Link href="/events" className="hover:text-foreground">
            Events
          </Link>
          <Link href="/clubs" className="hover:text-foreground">
            Clubs
          </Link>
          <Link href="/marketplace" className="hover:text-foreground">
            Market
          </Link>
          <Link href="/search" className="hover:text-foreground">
            Search
          </Link>
        </div>
      </div>
    </div>
  );
}
