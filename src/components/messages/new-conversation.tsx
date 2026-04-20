"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
}

interface NewConversationResponse {
  conversation: { id: string };
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function NewConversation() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setUsers([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get<{ users: SearchUser[] }>(
          `/api/search?q=${encodeURIComponent(query.trim())}&includeUsers=true`
        );
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

  async function handleSelectUser(userId: string) {
    setStartingId(userId);
    try {
      const data = await api.post<NewConversationResponse>(
        "/api/conversations",
        { userId }
      );
      setOpen(false);
      setQuery("");
      setUsers([]);
      router.push(`/messages/${data.conversation.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start conversation"
      );
    } finally {
      setStartingId(null);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setUsers([]);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <MessageSquarePlus className="size-4" />
            New Message
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search input */}
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

          {/* Results */}
          <div className="min-h-[120px]">
            {isSearching ? (
              <div className="space-y-2 p-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-16" />
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
                      onClick={() => void handleSelectUser(u.id)}
                      disabled={!!startingId}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors disabled:opacity-60"
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
      </DialogContent>
    </Dialog>
  );
}
