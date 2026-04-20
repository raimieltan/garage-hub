"use client";

import { use, useState, useEffect, useCallback } from "react";
import { ArrowLeft, Star, Gauge } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { BuildTimeline } from "@/components/cars/build-timeline";
import { BuildUpdateForm } from "@/components/cars/build-update-form";
import { ModList } from "@/components/cars/mod-list";
import { ModForm } from "@/components/cars/mod-form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Car } from "@/types";

const CAR_GRADIENTS = [
  "from-slate-700 via-slate-800 to-slate-900",
  "from-red-800 via-red-900 to-red-950",
  "from-blue-800 via-blue-900 to-blue-950",
  "from-emerald-700 via-emerald-800 to-emerald-950",
  "from-purple-800 via-purple-900 to-purple-950",
  "from-orange-700 via-orange-800 to-orange-950",
];

function getGradient(id: string): string {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CAR_GRADIENTS[sum % CAR_GRADIENTS.length] ?? CAR_GRADIENTS[0];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function CarDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full aspect-[3/1] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buildKey, setBuildKey] = useState(0);
  const [modKey, setModKey] = useState(0);

  const fetchCar = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ car: Car }>(`/api/cars/${id}`);
      setCar(data.car);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load car");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchCar();
  }, [fetchCar]);

  const isOwner = !!(currentUser && car && currentUser.id === car.userId);
  const gradient = car ? getGradient(car.id) : CAR_GRADIENTS[0];

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <CarDetailSkeleton />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">Car not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 -ml-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      {/* Hero section */}
      <Card className="overflow-hidden py-0">
        {/* Large photo / gradient area */}
        <div
          className={`relative w-full aspect-[3/1] bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          {car.photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={car.photos[0]}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span
              className="text-7xl select-none drop-shadow-lg"
              role="img"
              aria-label="car"
            >
              🏎️
            </span>
          )}

          {/* Racing stripe accent */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.65 0.25 25), oklch(0.70 0.20 55))",
            }}
          />

          {/* Featured badge */}
          {car.isFeatured && (
            <div className="absolute top-3 right-3">
              <Badge className="gap-1 bg-yellow-500/90 text-yellow-950 hover:bg-yellow-500/90 shadow-md">
                <Star className="size-3 fill-yellow-950" />
                Featured
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold leading-tight">
                {car.year} {car.make} {car.model}
              </h1>
              {car.trim && (
                <p className="text-muted-foreground">{car.trim}</p>
              )}
            </div>

            {car.horsepower !== null && (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="racing-gradient rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <Gauge className="size-4 text-white" />
                  <span className="font-bold text-white tabular-nums">
                    {car.horsepower} HP
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Owner info */}
          {car.owner && (
            <>
              <Separator className="my-3" />
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity w-fit"
                onClick={() => router.push(`/profile/${car.owner!.username}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/profile/${car.owner!.username}`);
                }}
                aria-label={`View ${car.owner.displayName}'s profile`}
              >
                <Avatar className="size-7">
                  <AvatarImage
                    src={car.owner.avatarUrl ?? undefined}
                    alt={car.owner.displayName}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(car.owner.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {car.owner.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{car.owner.username}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="build-thread">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="build-thread">Build Thread</TabsTrigger>
            <TabsTrigger value="mod-list">Mod List</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex gap-2">
              <BuildUpdateForm
                carId={id}
                onSaved={() => setBuildKey((k) => k + 1)}
              />
              <ModForm
                carId={id}
                onSaved={() => setModKey((k) => k + 1)}
              />
            </div>
          )}
        </div>

        <TabsContent value="build-thread" className="mt-5">
          <BuildTimeline key={buildKey} carId={id} isOwner={isOwner} />
        </TabsContent>

        <TabsContent value="mod-list" className="mt-5">
          <ModList key={modKey} carId={id} isOwner={isOwner} />
        </TabsContent>

        <TabsContent value="details" className="mt-5">
          <Card>
            <CardContent className="p-5 space-y-4">
              {/* Description */}
              {car.description ? (
                <div>
                  <h3 className="font-semibold mb-2">About this build</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {car.description}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No description provided.
                </p>
              )}

              <Separator />

              {/* Specs */}
              <div>
                <h3 className="font-semibold mb-3">Specifications</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                      Year
                    </dt>
                    <dd className="font-medium mt-0.5">{car.year}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                      Make
                    </dt>
                    <dd className="font-medium mt-0.5">{car.make}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                      Model
                    </dt>
                    <dd className="font-medium mt-0.5">{car.model}</dd>
                  </div>
                  {car.trim && (
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                        Trim
                      </dt>
                      <dd className="font-medium mt-0.5">{car.trim}</dd>
                    </div>
                  )}
                  {car.horsepower !== null && (
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                        Horsepower
                      </dt>
                      <dd className="font-medium mt-0.5">
                        {car.horsepower} HP
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Featured badge */}
              {car.isFeatured && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Badge className="gap-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                      <Star className="size-3 fill-current" />
                      Featured Build
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      This build is featured on the owner&apos;s profile.
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
