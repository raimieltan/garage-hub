"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useChatDock } from "./chat-dock-context";

interface OtherUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ConversationMeta {
  id: string;
  otherUser: OtherUser;
  unreadCount: number;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface ChatHeadProps {
  conversationId: string;
}

export function ChatHead({ conversationId }: ChatHeadProps) {
  const { restore } = useChatDock();
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await api.get<{ conversations: ConversationMeta[] }>(
          "/api/conversations"
        );
        const found = data.conversations.find((c) => c.id === conversationId);
        if (!cancelled && found) setMeta(found);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const hasUnread = (meta?.unreadCount ?? 0) > 0;

  return (
    <div className="relative">
      <button
        onClick={() => restore(conversationId)}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        aria-label={`Open chat with ${meta?.otherUser.displayName ?? "user"}`}
        className={cn(
          "relative size-14 rounded-full ring-2 ring-border bg-card transition hover:ring-accent hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
        )}
      >
        <Avatar className="size-full rounded-full">
          {meta?.otherUser.avatarUrl && (
            <AvatarImage
              src={meta.otherUser.avatarUrl}
              alt={meta.otherUser.displayName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="text-sm rounded-full">
            {meta ? getInitials(meta.otherUser.displayName) : "??"}
          </AvatarFallback>
        </Avatar>

        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-accent ring-2 ring-card" />
        )}
      </button>

      {tooltipVisible && meta && (
        <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
            <p className="text-xs font-semibold text-foreground">
              {meta.otherUser.displayName}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              @{meta.otherUser.username}
            </p>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-[-5px] size-2.5 rotate-45 bg-card border-r border-t border-border" />
        </div>
      )}
    </div>
  );
}
