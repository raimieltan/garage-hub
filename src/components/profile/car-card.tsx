"use client";

import { Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Car } from "@/types";

interface CarCardProps {
  car: Car;
}

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

export function CarCard({ car }: CarCardProps) {
  const gradient = getGradient(car.id);

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      {/* Car visual */}
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
        <CardContent className="pt-0 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {car.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
