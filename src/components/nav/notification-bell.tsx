"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const POLL_INTERVAL = 30_000; // 30 seconds

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
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notificationText(n: Notification): string {
  const name = n.actor.displayName;
  switch (n.type) {
    case "LIKE":
      return `${name} liked your post`;
    case "COMMENT":
      return `${name} commented on your post`;
    case "FOLLOW":
      return `${name} started following you`;
    case "RSVP":
      return `${name} RSVP'd to your event`;
    case "CLUB_INVITE":
      return `${name} invited you to a club`;
  }
}

function notificationHref(n: Notification): string | null {
  switch (n.type) {
    case "LIKE":
    case "COMMENT":
      return n.postId ? `/posts/${n.postId}` : null;
    case "FOLLOW":
      return `/profile/${n.actor.username}`;
    case "RSVP":
      return n.eventId ? `/events/${n.eventId}` : null;
    case "CLUB_INVITE":
      return n.clubId ? `/clubs/${n.clubId}` : null;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetchingList, setIsFetchingList] = useState(false);

  // Poll unread count
  const fetchCount = useCallback(async () => {
    try {
      const data = await api.get<{ count: number }>("/api/notifications/count");
      setUnreadCount(data.count);
    } catch {
      // Silently fail — non-critical
    }
  }, []);

  useEffect(() => {
    void fetchCount();
    const id = setInterval(() => void fetchCount(), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Fetch notification list when dropdown opens
  async function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (open && notifications.length === 0) {
      setIsFetchingList(true);
      try {
        const data = await api.get<{ notifications: Notification[] }>(
          "/api/notifications?limit=10"
        );
        setNotifications(data.notifications ?? []);
      } catch {
        toast.error("Failed to load notifications");
      } finally {
        setIsFetchingList(false);
      }
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.post("/api/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  }

  async function handleNotificationClick(n: Notification) {
    const href = notificationHref(n);
    setIsOpen(false);

    // Mark individual notification read
    if (!n.read) {
      try {
        await api.post(`/api/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === n.id ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Best-effort
      }
    }

    if (href) router.push(href);
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={(o) => void handleOpenChange(o)}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          />
        }
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary hover:text-primary/80 px-2"
              onClick={() => void handleMarkAllRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notification list */}
        {isFetchingList ? (
          <div className="py-8 text-center">
            <div className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  "flex items-start gap-2.5 px-3 py-3 cursor-pointer rounded-none focus:rounded-none",
                  !n.read && "bg-primary/5"
                )}
                onClick={() => void handleNotificationClick(n)}
              >
                <Avatar className="size-8 mt-0.5 shrink-0">
                  {n.actor.avatarUrl && (
                    <AvatarImage
                      src={n.actor.avatarUrl}
                      alt={n.actor.displayName}
                    />
                  )}
                  <AvatarFallback className="text-xs">
                    {getInitials(n.actor.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    {notificationText(n)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        {/* Footer */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-sm text-primary hover:text-primary/80 cursor-pointer py-2"
          onClick={() => {
            setIsOpen(false);
            router.push("/notifications");
          }}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
