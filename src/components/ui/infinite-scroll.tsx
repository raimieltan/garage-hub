"use client";

import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  children: React.ReactNode;
  loader?: React.ReactNode;
  threshold?: number;
}

export function InfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  children,
  loader,
  threshold = 200,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(isLoading);
  const hasMoreRef = useRef(hasMore);

  // Keep refs in sync with props so the observer callback always has current values
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
        onLoadMore();
      }
    },
    [onLoadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: `0px 0px ${threshold}px 0px`,
      threshold: 0,
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, threshold]);

  const defaultLoader = (
    <div className="flex justify-center py-4">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div>
      {children}
      {/* Sentinel element that triggers load when entering viewport */}
      <div ref={sentinelRef} aria-hidden="true" />
      {isLoading && (loader ?? defaultLoader)}
    </div>
  );
}
