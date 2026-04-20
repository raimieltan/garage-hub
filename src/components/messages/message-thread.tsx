"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface MessageThreadProps {
  conversationId: string;
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MessageSkeleton({ right }: { right?: boolean }) {
  return (
    <div className={cn("flex gap-2 items-end", right && "flex-row-reverse")}>
      <Skeleton className="size-7 rounded-full shrink-0" />
      <Skeleton
        className={cn("h-10 rounded-2xl", right ? "w-48 rounded-br-sm" : "w-56 rounded-bl-sm")}
      />
    </div>
  );
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ messages: Message[] }>(
        `/api/conversations/${conversationId}/messages`
      );
      // API returns newest-first; reverse for chronological display
      setMessages([...data.messages].reverse());

      // Mark as read
      await api.post(`/api/conversations/${conversationId}/read`).catch(() => {
        // Non-critical — ignore errors
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load messages"
      );
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  // Scroll to bottom when messages load or update
  useEffect(() => {
    if (!isLoading) {
      scrollToBottom("instant");
    }
  }, [isLoading, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages.length, scrollToBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    const messageContent = content.trim();
    setContent("");
    setIsSending(true);

    try {
      const data = await api.post<{ message: Message }>(
        `/api/conversations/${conversationId}/messages`,
        { content: messageContent }
      );
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
      setContent(messageContent);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <ScrollArea className="flex-1 min-h-0">
        <div ref={viewportRef} className="p-4 space-y-3">
          {isLoading ? (
            <>
              <MessageSkeleton />
              <MessageSkeleton right />
              <MessageSkeleton />
              <MessageSkeleton right />
              <MessageSkeleton />
            </>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-sm">No messages yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Say hello to start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              const sender = message.sender;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 items-end group",
                    isOwn && "flex-row-reverse"
                  )}
                >
                  {/* Avatar — only for received messages */}
                  {!isOwn && (
                    <Avatar className="size-7 shrink-0 mb-0.5">
                      {sender?.avatarUrl && (
                        <AvatarImage
                          src={sender.avatarUrl}
                          alt={sender.displayName}
                        />
                      )}
                      <AvatarFallback className="text-xs">
                        {sender ? getInitials(sender.displayName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "flex flex-col max-w-[75%]",
                      isOwn && "items-end"
                    )}
                  >
                    <div
                      className={cn(
                        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      {message.content}
                    </div>
                    <span
                      className="text-xs text-muted-foreground/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      suppressHydrationWarning
                    >
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="border-t border-border p-3">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <Textarea
            placeholder="Type a message... (Enter to send)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="resize-none flex-1 min-h-[40px] max-h-32 text-sm py-2.5"
            disabled={isSending || isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !content.trim() || isLoading}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
