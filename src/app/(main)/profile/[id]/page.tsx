"use client";

import { use, useState, useEffect, useCallback } from "react";
import { CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ProfileHeader } from "@/components/profile/profile-header";
import { GarageGrid } from "@/components/profile/garage-grid";
import { PostCard } from "@/components/feed/post-card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { User, Post, Car } from "@/types";

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ user: User }>(`/api/users/${id}`);
      setProfileUser(data.user);
      setCars(data.user.cars ?? []);

      // Check follow status
      if (currentUser && data.user.id !== currentUser.id) {
        try {
          const followData = await api.get<{ isFollowing: boolean }>(
            `/api/users/${data.user.id}/follow`
          );
          setIsFollowing(followData.isFollowing);
        } catch {
          // ignore follow check errors
        }
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUser]);

  const fetchPosts = useCallback(async () => {
    if (!profileUser) return;
    try {
      const data = await api.get<{ posts: Post[] }>(
        `/api/posts?authorId=${profileUser.id}`
      );
      setPosts(data.posts);
    } catch {
      // silently fail
    }
  }, [profileUser]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profileUser) {
      void fetchPosts();
    }
  }, [profileUser, fetchPosts]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="size-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        User not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileHeader
        user={profileUser}
        isFollowing={isFollowing}
        onFollowChange={setIsFollowing}
        onProfileUpdated={(updated) =>
          setProfileUser((prev) => (prev ? { ...prev, ...updated } : prev))
        }
      />

      <Separator />

      <Tabs defaultValue="posts">
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1">
            Posts
          </TabsTrigger>
          <TabsTrigger value="garage" className="flex-1">
            Garage
          </TabsTrigger>
          <TabsTrigger value="about" className="flex-1">
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No posts yet.
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>

        <TabsContent value="garage" className="mt-4">
          <GarageGrid
            cars={cars}
            emptyMessage="This user has no cars in their garage yet."
          />
        </TabsContent>

        <TabsContent value="about" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border p-5 space-y-4">
            {profileUser.bio ? (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Bio
                </h3>
                <p className="text-sm whitespace-pre-wrap">{profileUser.bio}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No bio yet.
              </p>
            )}

            <Separator />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              <span suppressHydrationWarning>
                Member since {formatMemberSince(profileUser.createdAt)}
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
