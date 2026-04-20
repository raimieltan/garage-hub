"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PostCard } from "@/components/feed/post-card";
import type { Post, Comment } from "@/types";

interface PostDetailProps {
  postId: string;
}

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

function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="size-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function PostDetail({ postId }: PostDetailProps) {
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPost = useCallback(async () => {
    setIsLoadingPost(true);
    try {
      const data = await api.get<{ post: Post }>(`/api/posts/${postId}`);
      setPost(data.post);
    } catch {
      toast.error("Failed to load post");
    } finally {
      setIsLoadingPost(false);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const data = await api.get<{ comments: Comment[] }>(
        `/api/posts/${postId}/comments`
      );
      setComments(data.comments);
    } catch {
      // silently fail
    } finally {
      setIsLoadingComments(false);
    }
  }, [postId]);

  useEffect(() => {
    void fetchPost();
    void fetchComments();
  }, [fetchPost, fetchComments]);

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsSubmitting(true);
    try {
      const data = await api.post<{ comment: Comment }>(
        `/api/posts/${postId}/comments`,
        { content: commentContent.trim() }
      );
      setComments((prev) => [...prev, data.comment]);
      setCommentContent("");
      if (post) {
        setPost({
          ...post,
          _count: { ...post._count, comments: post._count.comments + 1 },
        });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to post comment"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingPost) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-xl" />
        <div className="space-y-3 pt-2">
          {[...Array(3)].map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Post not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PostCard
        post={post}
        onLikeToggle={(_, liked, count) => {
          setPost((p) =>
            p ? { ...p, isLiked: liked, _count: { ...p._count, likes: count } } : p
          );
        }}
      />

      <Separator />

      <div className="space-y-4">
        <h2 className="font-semibold text-sm">
          {post._count.comments} Comment{post._count.comments !== 1 ? "s" : ""}
        </h2>

        {/* Comment form */}
        {isAuthenticated && user && (
          <form onSubmit={handleCommentSubmit} className="flex gap-3">
            <Avatar className="size-8 shrink-0 mt-1">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
              )}
              <AvatarFallback className="text-xs">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={2}
                className="resize-none flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    void handleCommentSubmit(e as unknown as React.FormEvent);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSubmitting || !commentContent.trim()}
                className="self-end"
                aria-label="Submit comment"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Comments list */}
        <div className="space-y-4">
          {isLoadingComments ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Link href={`/profile/${comment.author.username}`}>
                  <Avatar className="size-8 shrink-0">
                    {comment.author.avatarUrl && (
                      <AvatarImage
                        src={comment.author.avatarUrl}
                        alt={comment.author.displayName}
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.author.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/profile/${comment.author.username}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {comment.author.displayName}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      @{comment.author.username}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto" suppressHydrationWarning>
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
