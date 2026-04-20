"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  MessageCircle,
  Calendar,
  MapPin,
  Users,
  Flame,
  Car,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ClubCard } from "@/components/clubs/club-card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Post, Event } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClubApiItem {
  id: string;
  name: string;
  description: string;
  coverImage: string | null;
  creatorId: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  memberCount: number;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAR_MAKES = [
  "Toyota",
  "Honda",
  "Nissan",
  "Ford",
  "Chevrolet",
  "BMW",
  "Subaru",
  "Mazda",
  "Porsche",
  "Tesla",
  "Dodge",
  "Volkswagen",
];

const BUILD_GRADIENTS = [
  "from-red-700 to-orange-500",
  "from-orange-600 to-yellow-400",
  "from-red-900 to-red-600",
  "from-blue-700 to-indigo-500",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function PostMiniSkeleton() {
  return (
    <div className="rounded-xl border border-border p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <Skeleton className="size-7 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-14 ml-auto rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-3 pt-0.5">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  );
}

function EventMiniSkeleton() {
  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

function BuildCardSkeleton() {
  return (
    <div className="min-w-[200px] rounded-xl border border-border overflow-hidden shrink-0">
      <div className="h-28 bg-muted" />
      <div className="p-3 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// ─── Section components ───────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-primary" />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
      >
        See all
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [buildPosts, setBuildPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<ClubApiItem[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingBuilds, setIsLoadingBuilds] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);

  const fetchAll = useCallback(async () => {
    // Fetch all sections in parallel
    const [postsResult, buildsResult, eventsResult, clubsResult] =
      await Promise.allSettled([
        api.get<{ posts: Post[] }>("/api/posts?limit=6"),
        api.get<{ posts: Post[] }>("/api/posts?type=BUILD_UPDATE&limit=4"),
        api.get<{ events: Event[] }>("/api/events?limit=3"),
        api.get<{ clubs: ClubApiItem[] }>("/api/clubs?limit=6"),
      ]);

    if (postsResult.status === "fulfilled") {
      setPosts(postsResult.value.posts ?? []);
    } else {
      toast.error("Failed to load trending posts");
    }
    setIsLoadingPosts(false);

    if (buildsResult.status === "fulfilled") {
      setBuildPosts(buildsResult.value.posts ?? []);
    }
    setIsLoadingBuilds(false);

    if (eventsResult.status === "fulfilled") {
      setEvents(eventsResult.value.events ?? []);
    } else {
      toast.error("Failed to load events");
    }
    setIsLoadingEvents(false);

    if (clubsResult.status === "fulfilled") {
      setClubs(clubsResult.value.clubs ?? []);
    } else {
      toast.error("Failed to load clubs");
    }
    setIsLoadingClubs(false);
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-10">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold">Explore</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Discover builds, events, and communities
        </p>
      </div>

      {/* ── Section 1: Trending Posts ── */}
      <section>
        <SectionHeader icon={Flame} title="Trending Posts" href="/feed" />

        {isLoadingPosts ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <PostMiniSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-border">
            No posts yet. Check back soon!
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="block group">
                <Card className="hover:bg-accent/30 transition-colors h-full">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="size-7 shrink-0">
                        {post.author.avatarUrl && (
                          <AvatarImage
                            src={post.author.avatarUrl}
                            alt={post.author.displayName}
                          />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(post.author.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate">
                        {post.author.displayName}
                      </span>
                      <Badge
                        variant={
                          post.postType === "BUILD_UPDATE"
                            ? "default"
                            : post.postType === "DYNO_RESULT"
                            ? "destructive"
                            : "secondary"
                        }
                        className="ml-auto shrink-0 text-xs"
                      >
                        {post.postType === "BUILD_UPDATE"
                          ? "Build"
                          : post.postType === "DYNO_RESULT"
                          ? "Dyno"
                          : post.postType === "PHOTO"
                          ? "Photo"
                          : "Post"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="size-3.5" />
                        {post._count.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="size-3.5" />
                        {post._count.comments}
                      </span>
                      <span className="ml-auto" suppressHydrationWarning>
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: Featured Builds ── */}
      <section>
        <SectionHeader icon={Zap} title="Featured Builds" href="/feed?type=BUILD_UPDATE" />

        {isLoadingBuilds ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[...Array(4)].map((_, i) => (
              <BuildCardSkeleton key={i} />
            ))}
          </div>
        ) : buildPosts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-border">
            No build updates yet.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {buildPosts.map((post, idx) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block group min-w-[200px] max-w-[200px] shrink-0"
              >
                <div className="rounded-xl border border-border overflow-hidden hover:ring-1 hover:ring-primary/40 transition-all">
                  {/* Gradient placeholder for build photo */}
                  <div
                    className={`h-28 bg-gradient-to-br ${BUILD_GRADIENTS[idx % BUILD_GRADIENTS.length]} flex items-center justify-center`}
                  >
                    <Car className="size-10 text-white/30" />
                  </div>
                  <div className="p-3">
                    {post.car && (
                      <p className="text-xs font-semibold text-foreground truncate">
                        {post.car.year} {post.car.make} {post.car.model}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {post.author.displayName}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Heart className="size-3" />
                        {post._count.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 3: Browse by Make ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Car className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Browse by Make</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {CAR_MAKES.map((make) => (
            <Link
              key={make}
              href={`/search?type=cars&q=${encodeURIComponent(make)}`}
            >
              <Button
                variant="outline"
                size="sm"
                className="hover:border-primary hover:text-primary transition-colors"
              >
                {make}
              </Button>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Section 4: Recent Events ── */}
      <section>
        <SectionHeader icon={Calendar} title="Recent Events" href="/events" />

        {isLoadingEvents ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <EventMiniSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-border">
            No upcoming events.{" "}
            <Link href="/events" className="underline hover:text-foreground">
              Create one!
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block group">
                <div className="rounded-xl border border-border p-4 hover:bg-accent/30 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors leading-tight">
                      {event.title}
                    </p>
                    <Badge variant="secondary" className="shrink-0 text-xs gap-1">
                      <Users className="size-3" />
                      {event._count.rsvps}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      <Calendar className="size-3.5 shrink-0" />
                      {formatEventDate(event.date)}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate max-w-[180px]">{event.location}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 5: Active Clubs ── */}
      <section>
        <SectionHeader icon={Users} title="Active Clubs" href="/clubs" />

        {isLoadingClubs ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <div className="h-20 bg-muted" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-border">
            No clubs yet.{" "}
            <Link href="/clubs" className="underline hover:text-foreground">
              Create the first one!
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {clubs.map((club) => (
              <ClubCard
                key={club.id}
                club={{ ...club, memberCount: club.memberCount }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
