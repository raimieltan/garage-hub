"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Trash2,
  Cog,
  Wind,
  Fan,
  ArrowDownUp,
  CircleStop,
  Circle,
  PaintBucket,
  Armchair,
  Cpu,
  Settings,
  Zap,
  Fuel,
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ModForm } from "@/components/cars/mod-form";
import type { CarMod } from "@/types";

interface ModListProps {
  carId: string;
  isOwner: boolean;
}

interface CategoryConfig {
  icon: LucideIcon;
  label: string;
  borderColor: string;
  iconColor: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  ENGINE: {
    icon: Cog,
    label: "Engine",
    borderColor: "border-l-red-500",
    iconColor: "text-red-400",
  },
  EXHAUST: {
    icon: Wind,
    label: "Exhaust",
    borderColor: "border-l-orange-500",
    iconColor: "text-orange-400",
  },
  INTAKE: {
    icon: Fan,
    label: "Intake",
    borderColor: "border-l-blue-500",
    iconColor: "text-blue-400",
  },
  SUSPENSION: {
    icon: ArrowDownUp,
    label: "Suspension",
    borderColor: "border-l-yellow-500",
    iconColor: "text-yellow-400",
  },
  BRAKES: {
    icon: CircleStop,
    label: "Brakes",
    borderColor: "border-l-rose-500",
    iconColor: "text-rose-400",
  },
  WHEELS_TIRES: {
    icon: Circle,
    label: "Wheels & Tires",
    borderColor: "border-l-slate-400",
    iconColor: "text-slate-400",
  },
  EXTERIOR: {
    icon: PaintBucket,
    label: "Exterior",
    borderColor: "border-l-purple-500",
    iconColor: "text-purple-400",
  },
  INTERIOR: {
    icon: Armchair,
    label: "Interior",
    borderColor: "border-l-emerald-500",
    iconColor: "text-emerald-400",
  },
  ELECTRONICS: {
    icon: Cpu,
    label: "Electronics",
    borderColor: "border-l-cyan-500",
    iconColor: "text-cyan-400",
  },
  DRIVETRAIN: {
    icon: Settings,
    label: "Drivetrain",
    borderColor: "border-l-indigo-500",
    iconColor: "text-indigo-400",
  },
  FORCED_INDUCTION: {
    icon: Zap,
    label: "Forced Induction",
    borderColor: "border-l-amber-500",
    iconColor: "text-amber-400",
  },
  FUEL: {
    icon: Fuel,
    label: "Fuel",
    borderColor: "border-l-green-500",
    iconColor: "text-green-400",
  },
  OTHER: {
    icon: Package,
    label: "Other",
    borderColor: "border-l-muted-foreground",
    iconColor: "text-muted-foreground",
  },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function groupByCategory(mods: CarMod[]): Map<string, CarMod[]> {
  const map = new Map<string, CarMod[]>();
  for (const mod of mods) {
    const existing = map.get(mod.category);
    if (existing) {
      existing.push(mod);
    } else {
      map.set(mod.category, [mod]);
    }
  }
  return map;
}

function ModSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          {[...Array(2)].map((_, j) => (
            <div key={j} className="flex justify-between">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ModList({ carId, isOwner }: ModListProps) {
  const [mods, setMods] = useState<CarMod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMods = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ mods: CarMod[] }>(
        `/api/cars/${carId}/mods`
      );
      setMods(data.mods);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load mods");
    } finally {
      setIsLoading(false);
    }
  }, [carId]);

  useEffect(() => {
    void fetchMods();
  }, [fetchMods]);

  async function handleDelete(modId: string) {
    setDeletingId(modId);
    try {
      await api.delete(`/api/cars/${carId}/mods/${modId}`);
      toast.success("Mod removed");
      setMods((prev) => prev.filter((m) => m.id !== modId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete mod");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return <ModSkeleton />;
  }

  if (mods.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-muted-foreground font-medium">No mods listed yet.</p>
        <p className="text-sm text-muted-foreground">
          Add your first modification to track your build investment.
        </p>
      </div>
    );
  }

  const grouped = groupByCategory(mods);
  const totalInvestment = mods.reduce((sum, m) => sum + (m.price ?? 0), 0);

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([category, categoryMods]) => {
        const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["OTHER"]!;
        const Icon = config.icon;
        const categoryTotal = categoryMods.reduce(
          (sum, m) => sum + (m.price ?? 0),
          0
        );

        return (
          <div
            key={category}
            className={`rounded-lg border border-border border-l-4 ${config.borderColor} overflow-hidden`}
          >
            {/* Category header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Icon className={`size-4 ${config.iconColor}`} />
                <span className="font-semibold text-sm">{config.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {categoryMods.length}
                </Badge>
              </div>
              {categoryTotal > 0 && (
                <span className="text-sm font-medium text-muted-foreground">
                  {formatPrice(categoryTotal)}
                </span>
              )}
            </div>

            <Separator />

            {/* Mods list */}
            <div className="divide-y divide-border">
              {categoryMods.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {mod.partName}
                      </span>
                      {mod.brand && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {mod.brand}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      {mod.installDate && (
                        <span>{formatDate(mod.installDate)}</span>
                      )}
                      {mod.notes && (
                        <span className="truncate max-w-xs">{mod.notes}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {mod.price !== null && (
                      <span className="font-semibold text-sm tabular-nums">
                        {formatPrice(mod.price)}
                      </span>
                    )}
                    {isOwner && (
                      <div className="flex gap-1">
                        <ModForm
                          carId={carId}
                          existingMod={mod}
                          onSaved={() => void fetchMods()}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive size-8"
                          onClick={() => void handleDelete(mod.id)}
                          disabled={deletingId === mod.id}
                          aria-label="Delete mod"
                        >
                          {deletingId === mod.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Total investment bar */}
      {totalInvestment > 0 && (
        <div className="racing-gradient rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-white">Total Investment</span>
          <span className="font-bold text-lg text-white tabular-nums">
            {formatPrice(totalInvestment)}
          </span>
        </div>
      )}
    </div>
  );
}
