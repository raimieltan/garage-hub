"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  ChevronDown,
  Loader2,
  Paperclip,
  Phone,
  Send,
  Smile,
  Video,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useChatDock } from "./chat-dock-context";
import type { Message } from "@/types";

const ACTIVE_POLL = 8_000;
const IDLE_POLL = 30_000;
const IDLE_AFTER = 2 * 60_000;

interface OtherUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ConversationMeta {
  id: string;
  otherUser: OtherUser;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function MessageSkeleton({ right }: { right?: boolean }) {
  return (
    <div className={cn("flex gap-2 items-end", right && "flex-row-reverse")}>
      <Skeleton className="size-6 rounded-full shrink-0" />
      <Skeleton
        className={cn(
          "h-9 rounded-xl",
          right ? "w-36 rounded-br-sm" : "w-44 rounded-bl-sm"
        )}
      />
    </div>
  );
}

interface ChatWindowProps {
  conversationId: string;
  index: number;
}

export function ChatWindow({ conversationId, index }: ChatWindowProps) {
  const { user } = useAuth();
  const { closeChat, minimize } = useChatDock();
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lastMessageIdRef = useRef<string | null>(null);
  const indexLabel = `CH-${String(index + 1).padStart(2, "0")}`;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.get<{ messages: Message[]; conversation?: ConversationMeta }>(
        `/api/conversations/${conversationId}/messages`
      );
      const ordered = [...data.messages].reverse();
      const newestId = ordered[ordered.length - 1]?.id ?? null;
      if (newestId !== lastMessageIdRef.current) {
        lastMessageIdRef.current = newestId;
        lastActivityRef.current = Date.now();
      }
      setMessages(ordered);
      if (data.conversation) setMeta(data.conversation);
      await api.post(`/api/conversations/${conversationId}/read`).catch(() => {});
    } catch {
      /* silent on poll */
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const fetchMeta = useCallback(async () => {
    try {
      const data = await api.get<{ conversations: ConversationMeta[] }>(
        "/api/conversations"
      );
      const found = data.conversations.find((c) => c.id === conversationId);
      if (found) setMeta(found);
    } catch {
      /* ignore */
    }
  }, [conversationId]);

  useEffect(() => {
    setIsLoading(true);
    void fetchMeta();
    void fetchMessages();
  }, [fetchMeta, fetchMessages]);

  useEffect(() => {
    if (!isLoading) scrollToBottom("instant");
  }, [isLoading, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom("smooth");
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function schedule() {
      if (cancelled || document.hidden) return;
      const idle = Date.now() - lastActivityRef.current > IDLE_AFTER;
      timeoutId = setTimeout(tick, idle ? IDLE_POLL : ACTIVE_POLL);
    }

    async function tick() {
      await fetchMessages();
      schedule();
    }

    function handleVisibility() {
      if (timeoutId) clearTimeout(timeoutId);
      if (!document.hidden) void tick();
    }

    schedule();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isSending) return;
    const text = content.trim();
    setContent("");
    setIsSending(true);
    try {
      const data = await api.post<{ message: Message }>(
        `/api/conversations/${conversationId}/messages`,
        { content: text }
      );
      setMessages((prev) => [...prev, data.message]);
      lastMessageIdRef.current = data.message.id;
      lastActivityRef.current = Date.now();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
      setContent(text);
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

  const otherUser = meta?.otherUser;

  return (
    <div className="flex w-[340px] flex-col rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 ring-1 ring-black/10 overflow-hidden"
      style={{ height: 460 }}>
      {/* Amber top rule */}
      <div className="h-px w-full bg-accent shrink-0" />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border bg-card shrink-0">
        <div className="relative shrink-0">
          <Avatar className="size-8 ring-1 ring-border">
            {otherUser?.avatarUrl && (
              <AvatarImage
                src={otherUser.avatarUrl}
                alt={otherUser.displayName}
              />
            )}
            <AvatarFallback className="text-xs">
              {otherUser ? getInitials(otherUser.displayName) : "??"}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-semibold text-foreground leading-tight">
            {otherUser?.displayName ?? (
              <Skeleton className="h-3.5 w-24" />
            )}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent mt-0.5">
            {indexLabel}
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Voice call"
            className="text-muted-foreground hover:text-foreground"
          >
            <Phone className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Video call"
            className="text-muted-foreground hover:text-foreground"
          >
            <Video className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Minimize"
            onClick={() => minimize(conversationId)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => closeChat(conversationId)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-2.5">
          {isLoading ? (
            <>
              <MessageSkeleton />
              <MessageSkeleton right />
              <MessageSkeleton />
              <MessageSkeleton right />
            </>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-xs">No messages yet.</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mt-1">
                Open transmission
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              const sender = msg.sender;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 items-end group",
                    isOwn && "flex-row-reverse"
                  )}
                >
                  {!isOwn && (
                    <Avatar className="size-6 shrink-0 mb-0.5">
                      {sender?.avatarUrl && (
                        <AvatarImage
                          src={sender.avatarUrl}
                          alt={sender.displayName}
                        />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {sender ? getInitials(sender.displayName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "flex flex-col max-w-[72%]",
                      isOwn && "items-end"
                    )}
                  >
                    <div
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm leading-snug break-words",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                    <span
                      className="font-mono text-[9px] text-muted-foreground/50 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      suppressHydrationWarning
                    >
                      {timeAgo(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border px-2.5 py-2 shrink-0 bg-card">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <div className="flex gap-1 shrink-0 pb-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Attach file"
              className="text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Sticker / emoji"
              className="text-muted-foreground hover:text-foreground"
            >
              <Smile className="size-3.5" />
            </Button>
          </div>
          <Textarea
            placeholder="Transmit..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="resize-none flex-1 min-h-[34px] max-h-24 text-xs py-2 rounded-xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-accent/50"
            disabled={isSending || isLoading}
          />
          <Button
            type="submit"
            size="icon-xs"
            disabled={isSending || !content.trim() || isLoading}
            aria-label="Send"
            className="mb-0.5 bg-accent hover:bg-accent/80 text-accent-foreground"
          >
            {isSending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
