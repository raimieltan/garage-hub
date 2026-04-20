"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ClubCard } from "@/components/clubs/club-card";
import { CreateClub } from "@/components/clubs/create-club";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

interface ClubApiItem {
  id: string;
  name: string;
  description: string;
  coverImage: string | null;
  creatorId: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  memberCount: number;
  createdAt: string;
}

function ClubCardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="h-20 bg-muted" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-5 w-20 rounded-full mt-2" />
      </div>
    </div>
  );
}

export default function ClubsPage() {
  const { isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState<ClubApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchClubs = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : "";
      const data = await api.get<{ clubs: ClubApiItem[] }>(`/api/clubs${params}`);
      setClubs(data.clubs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load clubs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClubs(debouncedSearch);
  }, [fetchClubs, debouncedSearch]);

  function handleClubCreated(club: ClubApiItem) {
    setClubs((prev) => [club, ...prev]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Car Clubs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Find and join communities of enthusiasts
          </p>
        </div>
        {isAuthenticated && <CreateClub onClubCreated={handleClubCreated} />}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search clubs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Clubs grid */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <ClubCardSkeleton key={i} />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Users className="size-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {debouncedSearch
              ? `No clubs found for "${debouncedSearch}"`
              : "No clubs yet. Be the first to create one!"}
          </p>
          {!debouncedSearch && isAuthenticated && (
            <CreateClub onClubCreated={handleClubCreated} />
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={{ ...club, memberCount: club.memberCount }} />
          ))}
        </div>
      )}
    </div>
  );
}
