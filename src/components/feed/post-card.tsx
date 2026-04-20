"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Share2, Car, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { YouTubeEmbed, extractYouTubeUrls } from "@/components/ui/youtube-embed";
import type { Post } from "@/types";

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: string, isLiked: boolean, newCount: number) => void;
}

const POST_TYPE_LABELS: Record<Post["postType"], string> = {
  GENERAL: "General",
  BUILD_UPDATE: "Build Update",
  DYNO_RESULT: "Dyno Result",
  PHOTO: "Photo",
};

const POST_TYPE_VARIANTS: Record<
  Post["postType"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  GENERAL: "secondary",
  BUILD_UPDATE: "default",
  DYNO_RESULT: "destructive",
  PHOTO: "outline",
};

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
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PHOTO_GRADIENTS = [
  "from-blue-500 to-purple-600",
  "from-orange-400 to-red-600",
  "from-green-400 to-teal-600",
  "from-yellow-400 to-orange-500",
  "from-pink-400 to-rose-600",
  "from-indigo-400 to-blue-600",
];

export function PostCard({ post, onLikeToggle }: PostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [isLiking, setIsLiking] = useState(false);

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      await api.post(`/api/posts/${post.id}/like`);
      const newLiked = !prevLiked;
      const newCount = prevLiked ? prevCount - 1 : prevCount + 1;
      onLikeToggle?.(post.id, newLiked, newCount);
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error("Failed to update like");
    } finally {
      setIsLiking(false);
    }
  }

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    void navigator.clipboard.writeText(
      `${window.location.origin}/posts/${post.id}`
    );
    toast.success("Link copied to clipboard");
  }

  function handleCardClick() {
    router.push(`/posts/${post.id}`);
  }

  return (
    <Card
      className="cursor-pointer hover:bg-accent/30 transition-colors"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/profile/${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar className="size-10 shrink-0">
                {post.author.avatarUrl && (
                  <AvatarImage
                    src={post.author.avatarUrl}
                    alt={post.author.displayName}
                  />
                )}
                <AvatarFallback>
                  {getInitials(post.author.displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/profile/${post.author.username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-sm hover:underline truncate"
                >
                  {post.author.displayName}
                </Link>
                <span className="text-muted-foreground text-sm truncate">
                  @{post.author.username}
                </span>
              </div>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant={POST_TYPE_VARIANTS[post.postType]} className="shrink-0">
            {POST_TYPE_LABELS[post.postType]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Car badge */}
        {post.car && (
          <div className="flex items-center gap-1.5">
            <Car className="size-3.5 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              {post.car.year} {post.car.make} {post.car.model}
              {post.car.trim ? ` ${post.car.trim}` : ""}
            </Badge>
          </div>
        )}

        {/* Content */}
        <MarkdownRenderer content={post.content} />

        {/* YouTube embeds */}
        {extractYouTubeUrls(post.content).map((url) => (
          <YouTubeEmbed key={url} url={url} />
        ))}

        {/* Dyno stats */}
        {post.postType === "DYNO_RESULT" &&
          (post.dynoHp || post.dynoTorque || post.dynoRpm) && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Gauge className="size-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Dyno Results
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {post.dynoHp !== null && (
                  <div className="text-center">
                    <p className="text-xl font-bold tabular-nums">
                      {post.dynoHp}
                    </p>
                    <p className="text-xs text-muted-foreground">HP</p>
                  </div>
                )}
                {post.dynoTorque !== null && (
                  <div className="text-center">
                    <p className="text-xl font-bold tabular-nums">
                      {post.dynoTorque}
                    </p>
                    <p className="text-xs text-muted-foreground">TQ (lb-ft)</p>
                  </div>
                )}
                {post.dynoRpm !== null && (
                  <div className="text-center">
                    <p className="text-xl font-bold tabular-nums">
                      {post.dynoRpm.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">RPM</p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Photos */}
        {post.photos.length > 0 && (
          <div
            className={`grid gap-2 ${
              post.photos.length === 1
                ? "grid-cols-1"
                : "grid-cols-2"
            }`}
          >
            {post.photos.slice(0, 4).map((photo, idx) => (
              <div
                key={idx}
                className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${
                  PHOTO_GRADIENTS[idx % PHOTO_GRADIENTS.length]
                } ${post.photos.length === 1 ? "aspect-video" : "aspect-square"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Post photo ${idx + 1}`}
                  className="absolute inset-0 size-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                {idx === 3 && post.photos.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      +{post.photos.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-rose-500"
            onClick={handleLike}
            aria-label={isLiked ? "Unlike post" : "Like post"}
          >
            <Heart
              className={`size-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`}
            />
            <span className="text-xs tabular-nums">{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/posts/${post.id}`);
            }}
            aria-label="View comments"
          >
            <MessageCircle className="size-4" />
            <span className="text-xs tabular-nums">{post._count.comments}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground ml-auto"
            onClick={handleShare}
            aria-label="Share post"
          >
            <Share2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
