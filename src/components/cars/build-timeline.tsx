"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { BuildUpdateForm } from "@/components/cars/build-update-form";
import type { BuildUpdate } from "@/types";

interface BuildTimelineProps {
  carId: string;
  isOwner: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PHOTO_GRADIENTS = [
  "from-slate-700 to-slate-900",
  "from-red-800 to-red-950",
  "from-blue-800 to-blue-950",
  "from-orange-700 to-orange-950",
];

function getPhotoGradient(index: number): string {
  return PHOTO_GRADIENTS[index % PHOTO_GRADIENTS.length] ?? PHOTO_GRADIENTS[0];
}

function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="w-0.5 h-24 mt-2" />
          </div>
          <div className="flex-1 pb-8 space-y-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BuildTimeline({ carId, isOwner }: BuildTimelineProps) {
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ updates: BuildUpdate[] }>(
        `/api/cars/${carId}/build-thread`
      );
      setUpdates(data.updates);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load build thread"
      );
    } finally {
      setIsLoading(false);
    }
  }, [carId]);

  useEffect(() => {
    void fetchUpdates();
  }, [fetchUpdates]);

  async function handleDelete(updateId: string) {
    setDeletingId(updateId);
    try {
      await api.delete(`/api/cars/${carId}/build-thread/${updateId}`);
      toast.success("Update deleted");
      setUpdates((prev) => prev.filter((u) => u.id !== updateId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete update");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-muted-foreground font-medium">No build updates yet.</p>
        <p className="text-sm text-muted-foreground">
          Start documenting your build!
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div
        className="absolute left-3 top-3 bottom-3 w-0.5"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.65 0.25 25), oklch(0.70 0.20 55), oklch(0.65 0.25 25))",
        }}
        aria-hidden="true"
      />

      <div className="space-y-0">
        {updates.map((update, index) => (
          <div key={update.id} className="relative flex gap-6 pb-10 last:pb-0">
            {/* Node dot */}
            <div className="relative z-10 flex-shrink-0 w-7 flex justify-center pt-1">
              <div
                className="size-3 rounded-full border-2 border-background ring-2"
                style={{
                  background:
                    index === 0
                      ? "oklch(0.65 0.25 25)"
                      : "oklch(0.35 0.01 260)",
                  boxShadow:
                    index === 0
                      ? "0 0 0 4px oklch(0.65 0.25 25 / 40%)"
                      : "none",
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="space-y-1">
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs font-normal"
                  >
                    <Calendar className="size-3" />
                    {formatDate(update.createdAt)}
                  </Badge>
                  <h3 className="font-semibold text-base leading-snug">
                    {update.title}
                  </h3>
                </div>

                {isOwner && (
                  <div className="flex gap-1 shrink-0">
                    <BuildUpdateForm
                      carId={carId}
                      existingUpdate={update}
                      onSaved={() => void fetchUpdates()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void handleDelete(update.id)}
                      disabled={deletingId === update.id}
                      aria-label="Delete update"
                    >
                      {deletingId === update.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {update.description}
              </p>

              {/* Photo grid */}
              {update.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {update.photos.map((photo, photoIndex) => (
                    <div
                      key={photoIndex}
                      className={`aspect-video rounded-lg bg-gradient-to-br ${getPhotoGradient(photoIndex)} overflow-hidden`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`Build photo ${photoIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
