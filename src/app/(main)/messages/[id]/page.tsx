"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageThread } from "@/components/messages/message-thread";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface ConversationUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ConversationDetail {
  id: string;
  user1Id: string;
  user2Id: string;
  user1: ConversationUser;
  user2: ConversationUser;
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ conversation: ConversationDetail }>(
        `/api/conversations/${id}`
      );
      setConversation(data.conversation);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load conversation"
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchConversation();
  }, [fetchConversation]);

  // Derive the other participant from the current user
  const otherUser = conversation
    ? conversation.user1Id === user?.id
      ? conversation.user2
      : conversation.user1
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -mx-4 -mt-6 md:mx-0 md:mt-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background shrink-0">
        <Link
          href="/messages"
          className="text-muted-foreground hover:text-foreground transition-colors -ml-1 md:hidden"
          aria-label="Back to messages"
        >
          <ArrowLeft className="size-5" />
        </Link>

        {isLoading ? (
          <>
            <Skeleton className="size-9 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </>
        ) : otherUser ? (
          <>
            <Avatar className="size-9">
              {otherUser.avatarUrl && (
                <AvatarImage
                  src={otherUser.avatarUrl}
                  alt={otherUser.displayName}
                />
              )}
              <AvatarFallback className="text-xs">
                {getInitials(otherUser.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/profile/${otherUser.username}`}
                className="font-semibold text-sm hover:underline"
              >
                {otherUser.displayName}
              </Link>
              <p className="text-xs text-muted-foreground">
                @{otherUser.username}
              </p>
            </div>
          </>
        ) : !isLoading ? (
          <p className="text-sm text-muted-foreground">Conversation not found</p>
        ) : null}
      </div>

      {/* Thread */}
      <div className="flex-1 min-h-0">
        {!isLoading && conversation ? (
          <MessageThread conversationId={id} />
        ) : !isLoading && !conversation ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Conversation not found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
