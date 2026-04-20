"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ListingCard } from "@/components/marketplace/listing-card";
import {
  ListingFiltersBar,
  type ListingFilters,
} from "@/components/marketplace/listing-filters";
import { CreateListing } from "@/components/marketplace/create-listing";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { MarketplaceListing } from "@/types";

const PAGE_SIZE = 12;

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MarketplacePage() {
  const { isAuthenticated } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<ListingFilters>({
    search: "",
    category: "",
    condition: "",
    minPrice: "",
    maxPrice: "",
  });

  const fetchListings = useCallback(
    async (currentFilters: ListingFilters, reset = false) => {
      if (reset) {
        setIsLoading(true);
        setCursor(null);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("limit", PAGE_SIZE.toString());
        if (!reset && cursor) params.set("cursor", cursor);
        if (currentFilters.search) params.set("search", currentFilters.search);
        if (currentFilters.category)
          params.set("category", currentFilters.category);
        if (currentFilters.condition)
          params.set("condition", currentFilters.condition);
        if (currentFilters.minPrice)
          params.set("minPrice", currentFilters.minPrice);
        if (currentFilters.maxPrice)
          params.set("maxPrice", currentFilters.maxPrice);

        const data = await api.get<{
          listings: MarketplaceListing[];
          nextCursor?: string;
        }>(`/api/marketplace?${params.toString()}`);

        if (reset) {
          setListings(data.listings);
        } else {
          setListings((prev) => [...prev, ...data.listings]);
        }

        setCursor(data.nextCursor ?? null);
        setHasMore(!!data.nextCursor);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load listings"
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [cursor]
  );

  useEffect(() => {
    void fetchListings(filters, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function handleFilterChange(newFilters: ListingFilters) {
    setFilters(newFilters);
  }

  function handleListingCreated(listing: MarketplaceListing) {
    setListings((prev) => [listing, ...prev]);
  }

  function handleLoadMore() {
    void fetchListings(filters, false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="size-6 text-primary" />
            Marketplace
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Buy and sell performance parts
          </p>
        </div>
        {isAuthenticated && (
          <CreateListing onCreated={handleListingCreated} />
        )}
      </div>

      {/* Filters */}
      <ListingFiltersBar onFilterChange={handleFilterChange} />

      {/* Listings grid */}
      {isLoading ? (
        <GridSkeleton />
      ) : listings.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <span className="text-5xl" role="img" aria-label="no listings">
            🔍
          </span>
          <p className="text-muted-foreground font-medium">No listings found.</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or be the first to list something!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                )}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
