import { CarCard } from "@/components/profile/car-card";
import type { Car } from "@/types";

interface GarageGridProps {
  cars: Car[];
  emptyMessage?: string;
}

export function GarageGrid({
  cars,
  emptyMessage = "No cars in the garage yet.",
}: GarageGridProps) {
  if (cars.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <span className="text-4xl" role="img" aria-label="garage">
          🏎️
        </span>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
}
