"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchResults } from "@/components/search/search-results";
import {
  SearchFilters,
  type FilterValues,
} from "@/components/search/search-filters";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { User, Car, Post } from "@/types";

type SearchType = "all" | "users" | "cars" | "posts";

interface SearchData {
  users: User[];
  cars: Car[];
  posts: Post[];
}

const TABS: { value: SearchType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "users", label: "Users" },
  { value: "cars", label: "Cars" },
  { value: "posts", label: "Posts" },
];

const DEFAULT_FILTERS: FilterValues = {
  car: { yearMin: "", yearMax: "", make: "" },
  post: { postType: "" },
};

const EMPTY_RESULTS: SearchData = { users: [], cars: [], posts: [] };

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [type, setType] = useState<SearchType>(
    (searchParams.get("type") as SearchType | null) ?? "all"
  );
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [results, setResults] = useState<SearchData>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync URL params when query/type change
  function updateUrl(newQuery: string, newType: SearchType) {
    const params = new URLSearchParams();
    if (newQuery) params.set("q", newQuery);
    if (newType !== "all") params.set("type", newType);
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const runSearch = useCallback(
    async (q: string, t: SearchType, f: FilterValues) => {
      if (!q.trim()) {
        setResults(EMPTY_RESULTS);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({ q: q.trim() });

        if (t === "users" || t === "all") {
          params.set("includeUsers", "true");
        }
        if (t === "cars" || t === "all") {
          params.set("includeCars", "true");
          if (f.car.yearMin) params.set("yearMin", f.car.yearMin);
          if (f.car.yearMax) params.set("yearMax", f.car.yearMax);
          if (f.car.make) params.set("make", f.car.make);
        }
        if (t === "posts" || t === "all") {
          params.set("includePosts", "true");
          if (f.post.postType) params.set("postType", f.post.postType);
        }

        const data = await api.get<SearchData>(`/api/search?${params.toString()}`);
        setResults({
          users: data.users ?? [],
          cars: data.cars ?? [],
          posts: data.posts ?? [],
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Search failed. Please try again."
        );
        setResults(EMPTY_RESULTS);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced search on query/type/filters change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query, type, filters);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, type, filters, runSearch]);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    updateUrl(val, type);
  }

  function handleTypeChange(val: string) {
    const t = val as SearchType;
    setType(t);
    setFilters(DEFAULT_FILTERS);
    updateUrl(query, t);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find users, cars, and posts across GarageHub
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search for users, cars, or posts..."
          value={query}
          onChange={handleQueryChange}
          className="pl-9 h-11 text-base"
          autoFocus
        />
      </div>

      {/* Tab filters */}
      <Tabs value={type} onValueChange={handleTypeChange}>
        <TabsList>
          {TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Additional filters (cars / posts) */}
      {query.trim() && (
        <SearchFilters
          type={type}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Results / empty states */}
      {!query.trim() ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
          <Search className="size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">
            Search for users, cars, or posts
          </p>
          <p className="text-sm text-muted-foreground">
            Type something above to get started
          </p>
        </div>
      ) : (
        <SearchResults
          results={results}
          type={type}
          isLoading={isLoading}
          query={query}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  );
}
