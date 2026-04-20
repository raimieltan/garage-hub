"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OtherUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface LastMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  otherUser: OtherUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}

interface ConversationListProps {
  activeId?: string;
  onSelect?: (id: string) => void;
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string): string {
  try {
    return formatDistanceToNowStrict(new Date(dateStr), { addSuffix: false });
  } catch {
    return "";
  }
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="size-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="h-3 w-8 shrink-0" />
    </div>
  );
}

export function ConversationList({ activeId, onSelect }: ConversationListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ conversations: ConversationItem[] }>(
        "/api/conversations"
      );
      setConversations(data.conversations);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load conversations"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  if (isLoading) {
    return (
      <div className="divide-y divide-border">
        {[...Array(5)].map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-muted-foreground text-sm">No conversations yet.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Start a new message to connect with other enthusiasts.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const hasUnread = conv.unreadCount > 0;
        const isOwnLastMessage =
          conv.lastMessage?.senderId === user?.id;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect?.(conv.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50",
              isActive && "bg-accent"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="relative shrink-0">
              <Avatar className="size-10">
                {conv.otherUser.avatarUrl && (
                  <AvatarImage
                    src={conv.otherUser.avatarUrl}
                    alt={conv.otherUser.displayName}
                  />
                )}
                <AvatarFallback className="text-xs">
                  {getInitials(conv.otherUser.displayName)}
                </AvatarFallback>
              </Avatar>
              {hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-blue-500 ring-2 ring-background" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-sm truncate",
                    hasUnread ? "font-semibold" : "font-medium"
                  )}
                >
                  {conv.otherUser.displayName}
                </span>
                {conv.lastMessage && (
                  <span className="text-xs text-muted-foreground shrink-0" suppressHydrationWarning>
                    {formatTime(conv.lastMessage.createdAt)}
                  </span>
                )}
              </div>

              {conv.lastMessage ? (
                <p
                  className={cn(
                    "text-xs truncate mt-0.5",
                    hasUnread
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {isOwnLastMessage && (
                    <span className="text-muted-foreground">You: </span>
                  )}
                  {conv.lastMessage.content}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/50 mt-0.5 italic">
                  No messages yet
                </p>
              )}
            </div>

            {hasUnread && (
              <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
