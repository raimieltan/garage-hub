"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  MessageCircle,
  MessageSquarePlus,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useChatDock } from "@/components/chat-dock/chat-dock-context";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const POLL_INTERVAL = 30_000;

type TabKey = "all" | "unread";

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
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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

export function ChatPopover() {
  const { user, isAuthenticated } = useAuth();
  const { openChat } = useChatDock();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive =
    pathname === "/messages" || pathname.startsWith("/messages/");

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unreadCount ?? 0),
    0
  );

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.get<{ conversations: ConversationItem[] }>(
        "/api/conversations"
      );
      setConversations(data.conversations);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    void fetchConversations();
    const id = setInterval(() => void fetchConversations(), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [isOpen, fetchConversations]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filtered = conversations.filter((c) => {
    const matchesTab = tab === "all" || c.unreadCount > 0;
    const q = query.trim().toLowerCase();
    if (!q) return matchesTab;
    return (
      matchesTab &&
      (c.otherUser.displayName.toLowerCase().includes(q) ||
        c.otherUser.username.toLowerCase().includes(q))
    );
  });

  function handleSelectConversation(id: string) {
    openChat(id);
    setIsOpen(false);
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Messages${totalUnread > 0 ? ` (${totalUnread} unread)` : ""}`}
        aria-expanded={isOpen}
        className={cn(
          "relative flex items-center rounded-lg p-1.5 text-sm font-medium transition-colors",
          isActive || isOpen
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <MessageCircle className="size-5" />
        {totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground leading-none ring-2 ring-background">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[380px] rounded-2xl border border-border bg-popover shadow-2xl shadow-black/20 ring-1 ring-black/5 overflow-hidden z-50"
          style={{ maxHeight: 520 }}
          role="dialog"
          aria-label="Comms panel"
        >
          {/* Amber top rule */}
          <div className="h-px w-full bg-accent shrink-0" />

          {/* Header */}
          <div className="px-4 pt-3 pb-2.5 border-b border-border">
            <div className="pit-index mb-1.5">
              <span className="pit-index__num">CH</span>
              <span>Chats</span>
              <span className="pit-index__rule" />
              <Link
                href="/messages"
                onClick={() => setIsOpen(false)}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                See all
              </Link>
              <NewConversationInline onDone={() => setIsOpen(false)} />
            </div>
            <h2 className="font-display text-[22px] leading-tight italic text-foreground">
              Comms
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-4">
            {(["all", "unread"] as TabKey[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "mr-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors border-b-2 -mb-px",
                  tab === t
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search transmissions..."
                className="pl-8 h-8 text-xs bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-accent/50 rounded-lg"
              />
            </div>
          </div>

          {/* List */}
          <ScrollArea style={{ maxHeight: 340 }}>
            {isLoading ? (
              <div>
                {[...Array(4)].map((_, i) => (
                  <ConversationSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageCircle className="size-8 text-muted-foreground/20 mb-2.5" />
                <p className="text-sm text-muted-foreground">
                  {tab === "unread"
                    ? "No unread transmissions"
                    : query
                    ? `No matches for "${query}"`
                    : "No transmissions yet"}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mt-1">
                  {tab === "unread" ? "All clear" : "Open comms to connect"}
                </p>
              </div>
            ) : (
              <div>
                {filtered.map((conv) => {
                  const hasUnread = conv.unreadCount > 0;
                  const isOwnLast =
                    conv.lastMessage?.senderId === user?.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="size-10 ring-1 ring-border">
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
                          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-accent ring-2 ring-popover" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-sm truncate",
                              hasUnread
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground"
                            )}
                          >
                            {conv.otherUser.displayName}
                          </span>
                          {conv.lastMessage && (
                            <span
                              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground shrink-0"
                              suppressHydrationWarning
                            >
                              {timeAgo(conv.lastMessage.createdAt)}
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
                            {isOwnLast && (
                              <span className="text-muted-foreground">
                                You:{" "}
                              </span>
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
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Checker footer */}
          <div className="checker-strip" />
        </div>
      )}
    </div>
  );
}

function NewConversationInline({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);

  function handleChange(next: boolean) {
    setOpen(next);
    if (!next) onDone();
  }

  return (
    <Dialog open={open} onOpenChange={handleChange}>
      <DialogTrigger
        render={
          <button
            onClick={() => setOpen(true)}
            aria-label="New conversation"
            className="ml-auto flex items-center justify-center size-5 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          >
            <MessageSquarePlus className="size-3.5" />
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Transmission</DialogTitle>
        </DialogHeader>
        <NewConversationBody onDone={() => handleChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton as Skel } from "@/components/ui/skeleton";

function NewConversationBody({ onDone }: { onDone: () => void }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<
    { id: string; username: string; displayName: string; avatarUrl: string | null }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setUsers([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get<{
          users: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
          }[];
        }>(`/api/search?q=${encodeURIComponent(query.trim())}&includeUsers=true`);
        setUsers(data.users);
      } catch {
        setUsers([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleSelect(userId: string) {
    setStartingId(userId);
    try {
      await api.post<{ conversation: { id: string } }>("/api/conversations", {
        userId,
      });
      onDone();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start conversation"
      );
    } finally {
      setStartingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by username or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>
      <div className="min-h-[120px]">
        {isSearching ? (
          <div className="space-y-2 p-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2">
                <Skel className="size-9 rounded-full" />
                <div className="space-y-1">
                  <Skel className="h-3.5 w-24" />
                  <Skel className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length > 0 ? (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {users.map((u) => {
              const isStarting = startingId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => void handleSelect(u.id)}
                  disabled={!!startingId}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors disabled:opacity-60"
                >
                  <Avatar className="size-9 shrink-0">
                    {u.avatarUrl && (
                      <AvatarImage src={u.avatarUrl} alt={u.displayName} />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(u.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {u.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{u.username}
                    </p>
                  </div>
                  {isStarting && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : query.trim() ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No users found for &ldquo;{query}&rdquo;
          </div>
        ) : (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Start typing to search for users
          </div>
        )}
      </div>
    </div>
  );
}
