"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CarForm } from "@/components/garage/car-form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Car } from "@/types";
import { Star } from "lucide-react";

const CAR_GRADIENTS = [
  "from-slate-700 to-slate-900",
  "from-red-800 to-red-950",
  "from-blue-800 to-blue-950",
  "from-emerald-700 to-emerald-950",
  "from-purple-800 to-purple-950",
  "from-orange-700 to-orange-950",
];

function getGradient(id: string): string {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CAR_GRADIENTS[sum % CAR_GRADIENTS.length] ?? CAR_GRADIENTS[0];
}

function CarManageCard({
  car,
  onUpdated,
  onDeleted,
}: {
  car: Car;
  onUpdated: (car: Car) => void;
  onDeleted: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const gradient = getGradient(car.id);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await api.delete(`/api/cars/${car.id}`);
      toast.success("Car removed from garage");
      onDeleted(car.id);
      setShowConfirm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete car");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div
          className={`relative aspect-video bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <span className="text-5xl select-none" role="img" aria-label="car">
            🚗
          </span>
          {car.isFeatured && (
            <div className="absolute top-2 right-2">
              <Badge className="gap-1 bg-yellow-500/90 text-yellow-950 hover:bg-yellow-500/90">
                <Star className="size-3 fill-yellow-950" />
                Featured
              </Badge>
            </div>
          )}
        </div>
        <CardHeader className="pb-1 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold leading-tight">
                {car.year} {car.make} {car.model}
              </h3>
              {car.trim && (
                <p className="text-sm text-muted-foreground">{car.trim}</p>
              )}
            </div>
            {car.horsepower !== null && (
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {car.horsepower} HP
              </Badge>
            )}
          </div>
        </CardHeader>
        {car.description && (
          <CardContent className="pt-0 pb-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {car.description}
            </p>
          </CardContent>
        )}
        <CardContent className="pt-0 pb-3">
          <Separator className="mb-3" />
          <div className="flex gap-2">
            <CarForm car={car} onSaved={onUpdated} />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowConfirm(true)}
              aria-label="Delete car"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Car</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">
              {car.year} {car.make} {car.model}
            </span>{" "}
            from your garage? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function GaragePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCars = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ cars: Car[] }>("/api/cars");
      setCars(data.cars);
    } catch {
      toast.error("Failed to load your garage");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void fetchCars();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, fetchCars]);

  function handleCarSaved(car: Car) {
    setCars((prev) => {
      const idx = prev.findIndex((c) => c.id === car.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = car;
        return next;
      }
      return [car, ...prev];
    });
  }

  function handleCarDeleted(carId: string) {
    setCars((prev) => prev.filter((c) => c.id !== carId));
  }

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Please log in to manage your garage.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Garage</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {cars.length} car{cars.length !== 1 ? "s" : ""} in your collection
          </p>
        </div>
        <CarForm onSaved={handleCarSaved} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <span className="text-5xl" role="img" aria-label="garage">
            🏎️
          </span>
          <p className="text-muted-foreground">
            Your garage is empty. Add your first car!
          </p>
          <CarForm onSaved={handleCarSaved} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cars.map((car) => (
            <CarManageCard
              key={car.id}
              car={car}
              onUpdated={handleCarSaved}
              onDeleted={handleCarDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
