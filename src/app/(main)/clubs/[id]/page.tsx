"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ClubPostForm } from "@/components/clubs/club-post-form";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ClubPost } from "@/types";

interface ClubMember {
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface ClubDetail {
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
  memberships: ClubMember[];
  clubPosts: ClubPost[];
  memberCount: number;
  createdAt: string;
}

const COVER_GRADIENTS = [
  "from-red-700 to-orange-500",
  "from-orange-600 to-yellow-400",
  "from-red-900 to-red-600",
  "from-orange-800 to-red-500",
  "from-yellow-700 to-orange-600",
  "from-red-600 to-rose-400",
  "from-orange-900 to-amber-600",
  "from-rose-700 to-red-500",
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPostTime(dateStr: string): string {
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ClubDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-36 rounded-xl bg-muted" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export default function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, isAuthenticated } = useAuth();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [posts, setPosts] = useState<ClubPost[]>([]);

  const fetchClub = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{
        club: ClubDetail;
        isMember: boolean;
        membershipRole: string | null;
      }>(`/api/clubs/${id}`);
      setClub(data.club);
      setIsMember(data.isMember);
      setMembershipRole(data.membershipRole);
      setPosts(data.club.clubPosts ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load club");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchClub();
  }, [fetchClub]);

  async function handleJoinLeave() {
    if (!isAuthenticated) {
      toast.error("Sign in to join clubs");
      return;
    }
    if (membershipRole === "creator") {
      toast.error("Club creators cannot leave their own club");
      return;
    }

    setIsJoining(true);
    try {
      const data = await api.post<{ joined: boolean; message: string }>(
        `/api/clubs/${id}/join`
      );
      setIsMember(data.joined);
      if (data.joined) {
        setMembershipRole("member");
        setClub((prev) =>
          prev
            ? { ...prev, memberCount: prev.memberCount + 1 }
            : prev
        );
        toast.success("Joined the club!");
      } else {
        setMembershipRole(null);
        setClub((prev) =>
          prev
            ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) }
            : prev
        );
        toast.success("Left the club");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update membership");
    } finally {
      setIsJoining(false);
    }
  }

  function handlePostCreated(post: ClubPost) {
    setPosts((prev) => [post, ...prev]);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Link
          href="/clubs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Clubs
        </Link>
        <ClubDetailSkeleton />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Club not found.{" "}
        <Link href="/clubs" className="underline hover:text-foreground">
          Browse clubs
        </Link>
      </div>
    );
  }

  const gradient = getGradient(club.name);
  const isCreator = membershipRole === "creator";

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/clubs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
      >
        <ArrowLeft className="size-4" />
        Back to Clubs
      </Link>

      {/* Club header */}
      <div className="rounded-xl overflow-hidden border border-border">
        {/* Cover image / gradient */}
        <div className={`h-36 bg-gradient-to-br ${gradient} relative`}>
          <div className="absolute bottom-4 left-4 flex items-end gap-3">
            <div className="size-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ring-4 ring-background">
              <span className="text-white font-bold text-2xl">
                {club.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold leading-tight">{club.name}</h1>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="size-3.5" />
                <span>
                  {club.memberCount} member{club.memberCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {isAuthenticated && !isCreator && (
              <Button
                variant={isMember ? "outline" : "default"}
                onClick={handleJoinLeave}
                disabled={isJoining}
                className="shrink-0"
              >
                {isJoining && <Loader2 className="size-4 mr-2 animate-spin" />}
                {isMember ? "Leave Club" : "Join Club"}
              </Button>
            )}
            {isCreator && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                <Crown className="size-3" />
                Creator
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {club.description}
          </p>

          <Separator />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Created by</span>
            <Link
              href={`/profile/${club.creator.username}`}
              className="font-medium text-foreground hover:underline"
            >
              {club.creator.displayName}
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feed">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="members">
            Members ({club.memberCount})
          </TabsTrigger>
        </TabsList>

        {/* Feed tab */}
        <TabsContent value="feed" className="mt-4 space-y-4">
          {isMember && (
            <ClubPostForm clubId={id} onPostCreated={handlePostCreated} />
          )}

          {posts.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-muted-foreground text-sm">
                No posts in this club yet.
              </p>
              {isMember && (
                <p className="text-muted-foreground/60 text-xs">
                  Be the first to share something!
                </p>
              )}
              {!isMember && isAuthenticated && (
                <p className="text-muted-foreground/60 text-xs">
                  Join the club to start posting.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const author = club.memberships.find(
                  (m) => m.userId === post.authorId
                )?.user;

                return (
                  <div
                    key={post.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {author?.avatarUrl && (
                          <AvatarImage
                            src={author.avatarUrl}
                            alt={author.displayName}
                          />
                        )}
                        <AvatarFallback className="text-xs">
                          {author ? getInitials(author.displayName) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        {author ? (
                          <Link
                            href={`/profile/${author.username}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {author.displayName}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">
                            Unknown
                          </span>
                        )}
                        <p
                          className="text-xs text-muted-foreground"
                          suppressHydrationWarning
                        >
                          {formatPostTime(post.createdAt)}
                        </p>
                      </div>
                      {author &&
                        club.memberships.find((m) => m.userId === author.id)
                          ?.role === "creator" && (
                          <Badge variant="secondary" className="gap-1 ml-auto text-xs">
                            <Crown className="size-2.5" />
                            Creator
                          </Badge>
                        )}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Members tab */}
        <TabsContent value="members" className="mt-4">
          {club.memberships.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">
              No members yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {club.memberships.map((membership) => (
                <Link
                  key={membership.userId}
                  href={`/profile/${membership.user.username}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-accent transition-colors"
                >
                  <Avatar className="size-10 shrink-0">
                    {membership.user.avatarUrl && (
                      <AvatarImage
                        src={membership.user.avatarUrl}
                        alt={membership.user.displayName}
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(membership.user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {membership.user.displayName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {membership.role === "creator" ? (
                        <Badge variant="default" className="gap-1 text-xs px-1.5 py-0">
                          <Crown className="size-2.5" />
                          Creator
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          Member
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
