"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { PostCard } from "@/components/feed/post-card";
import { CreatePost } from "@/components/feed/create-post";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Post } from "@/types";

type FilterType = "ALL" | Post["postType"];

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "BUILD_UPDATE", label: "Build Updates" },
  { value: "DYNO_RESULT", label: "Dyno Results" },
  { value: "PHOTO", label: "Photos" },
];

function PostSkeleton() {
  return (
    <div className="rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="ml-auto h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(
    async (currentFilter: FilterType, reset = false) => {
      if (reset) {
        setIsLoading(true);
        setCursor(null);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        if (currentFilter !== "ALL") {
          params.set("type", currentFilter);
        }
        if (!reset && cursor) {
          params.set("cursor", cursor);
        }
        params.set("limit", "10");

        const url = `/api/posts${params.toString() ? `?${params.toString()}` : ""}`;
        const data = await api.get<{
          posts: Post[];
          nextCursor?: string;
        }>(url);

        if (reset) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setCursor(data.nextCursor ?? null);
        setHasMore(!!data.nextCursor);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [cursor]
  );

  useEffect(() => {
    void fetchPosts(filter, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function handlePostCreated(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleLoadMore() {
    void fetchPosts(filter, false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed</h1>
        <CreatePost onPostCreated={handlePostCreated} />
      </div>

      {/* Filter tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterType)}
      >
        <TabsList className="w-full sm:w-auto">
          {FILTERS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="text-xs sm:text-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-muted-foreground">No posts yet.</p>
          {filter !== "ALL" && (
            <p className="text-sm text-muted-foreground">
              Try switching to &quot;All&quot; to see all posts.
            </p>
          )}
        </div>
      ) : (
        <InfiniteScroll
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onLoadMore={handleLoadMore}
        >
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeToggle={(postId, isLiked, newCount) => {
                  setPosts((prev) =>
                    prev.map((p) =>
                      p.id === postId
                        ? {
                            ...p,
                            isLiked,
                            _count: { ...p._count, likes: newCount },
                          }
                        : p
                    )
                  );
                }}
              />
            ))}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
}
