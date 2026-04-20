"use client";

import { useRouter } from "next/navigation";
import { Heart, MessageSquare, Zap, Users, Car } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Car as CarType, Post } from "@/types";

type SearchType = "all" | "users" | "cars" | "posts";

interface SearchResultsData {
  users: User[];
  cars: CarType[];
  posts: Post[];
}

interface SearchResultsProps {
  results: SearchResultsData;
  type: SearchType;
  isLoading: boolean;
  query: string;
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const POST_TYPE_LABELS: Record<Post["postType"], string> = {
  GENERAL: "General",
  BUILD_UPDATE: "Build Update",
  DYNO_RESULT: "Dyno Result",
  PHOTO: "Photo",
};

const POST_TYPE_COLORS: Record<Post["postType"], string> = {
  GENERAL: "bg-muted text-muted-foreground",
  BUILD_UPDATE: "bg-orange-500/20 text-orange-400",
  DYNO_RESULT: "bg-red-500/20 text-red-400",
  PHOTO: "bg-blue-500/20 text-blue-400",
};

// ---- Sub-components ----

function UserResult({ user }: { user: User }) {
  const router = useRouter();
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50 border-border"
      onClick={() => router.push(`/profile/${user.username}`)}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <Avatar className="size-12 shrink-0">
          {user.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          )}
          <AvatarFallback className="text-sm font-medium">
            {getInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">
              {user.displayName}
            </span>
            <span className="text-sm text-muted-foreground shrink-0">
              @{user.username}
            </span>
          </div>
          {user.bio && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {user.bio}
            </p>
          )}
          {user._count !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <Users className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {user._count.followers.toLocaleString()} followers
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CarResult({ car }: { car: CarType }) {
  const router = useRouter();
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50 border-border"
      onClick={() => router.push(`/cars/${car.id}`)}
    >
      <CardContent className="flex items-center gap-3 p-4">
        {car.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={car.photos[0]}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="size-16 rounded-md object-cover shrink-0 border border-border"
          />
        ) : (
          <div className="size-16 rounded-md bg-accent flex items-center justify-center shrink-0 border border-border">
            <Car className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">
              {car.year} {car.make} {car.model}
            </span>
            {car.trim && (
              <span className="text-sm text-muted-foreground">{car.trim}</span>
            )}
            {car.horsepower != null && (
              <Badge className="bg-primary/20 text-primary border-0 text-xs font-medium gap-1">
                <Zap className="size-3" />
                {car.horsepower} HP
              </Badge>
            )}
          </div>
          {car.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {car.description}
            </p>
          )}
          {car.owner && (
            <p className="text-xs text-muted-foreground mt-1">
              Owned by{" "}
              <span className="text-foreground font-medium">
                {car.owner.displayName}
              </span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PostResult({ post }: { post: Post }) {
  const router = useRouter();
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50 border-border"
      onClick={() => router.push(`/posts/${post.id}`)}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
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
          <span className="text-sm font-medium text-foreground truncate">
            {post.author.displayName}
          </span>
          <span className="text-xs text-muted-foreground ml-auto shrink-0">
            {timeAgo(post.createdAt)}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {post.content}
          </p>
          <Badge
            className={`${POST_TYPE_COLORS[post.postType]} border-0 text-xs shrink-0`}
          >
            {POST_TYPE_LABELS[post.postType]}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Heart className="size-3.5" />
            <span className="text-xs">{post._count.likes}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageSquare className="size-3.5" />
            <span className="text-xs">{post._count.comments}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Skeletons ----

function ResultSkeleton() {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

// ---- Main Component ----

export function SearchResults({
  results,
  type,
  isLoading,
  query,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <ResultSkeleton key={i} />
        ))}
      </div>
    );
  }

  const showUsers = type === "all" || type === "users";
  const showCars = type === "all" || type === "cars";
  const showPosts = type === "all" || type === "posts";

  const hasResults =
    (showUsers && results.users.length > 0) ||
    (showCars && results.cars.length > 0) ||
    (showPosts && results.posts.length > 0);

  if (!hasResults) {
    if (!query) return null;
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-muted-foreground font-medium">No results found</p>
        <p className="text-sm text-muted-foreground">
          Try different keywords or adjust your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showUsers && results.users.length > 0 && (
        <section className="space-y-3">
          {type === "all" && (
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Users
            </h2>
          )}
          <div className="space-y-2">
            {results.users.map((user) => (
              <UserResult key={user.id} user={user} />
            ))}
          </div>
        </section>
      )}

      {showCars && results.cars.length > 0 && (
        <section className="space-y-3">
          {type === "all" && (
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Cars
            </h2>
          )}
          <div className="space-y-2">
            {results.cars.map((car) => (
              <CarResult key={car.id} car={car} />
            ))}
          </div>
        </section>
      )}

      {showPosts && results.posts.length > 0 && (
        <section className="space-y-3">
          {type === "all" && (
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Posts
            </h2>
          )}
          <div className="space-y-2">
            {results.posts.map((post) => (
              <PostResult key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
