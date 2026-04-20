"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ClubPost } from "@/types";

interface ClubPostFormProps {
  clubId: string;
  onPostCreated?: (post: ClubPost) => void;
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ClubPostForm({ clubId, onPostCreated }: ClubPostFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const data = await api.post<{ post: ClubPost }>(
        `/api/clubs/${clubId}/posts`,
        { content: content.trim() }
      );
      toast.success("Post shared with the club!");
      onPostCreated?.(data.post);
      setContent("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && content.trim()) {
      void handleSubmit(e as unknown as React.FormEvent);
    }
  }

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex gap-3">
        <Avatar className="size-9 shrink-0">
          {user.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          )}
          <AvatarFallback className="text-xs">
            {getInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>
        <Textarea
          placeholder="Share something with the club..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="resize-none flex-1 text-sm"
          disabled={isSubmitting}
        />
      </div>
      <div className="flex items-center justify-between pl-12">
        <p className="text-xs text-muted-foreground">
          Cmd/Ctrl + Enter to post
        </p>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !content.trim()}
          className="gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          Post
        </Button>
      </div>
    </form>
  );
}
