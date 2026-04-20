"use client";

import { Input } from "@/components/ui/input";

type SearchType = "all" | "users" | "cars" | "posts";

type PostType = "GENERAL" | "BUILD_UPDATE" | "DYNO_RESULT" | "PHOTO";

interface CarFilters {
  yearMin: string;
  yearMax: string;
  make: string;
}

interface PostFilters {
  postType: PostType | "";
}

export interface FilterValues {
  car: CarFilters;
  post: PostFilters;
}

interface SearchFiltersProps {
  type: SearchType;
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
}

const COMMON_MAKES = [
  "Any",
  "Acura",
  "Audi",
  "BMW",
  "Chevrolet",
  "Dodge",
  "Ford",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jeep",
  "Kia",
  "Lexus",
  "Mazda",
  "Mercedes-Benz",
  "Mitsubishi",
  "Nissan",
  "Porsche",
  "Subaru",
  "Toyota",
  "Volkswagen",
];

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "BUILD_UPDATE", label: "Build Update" },
  { value: "DYNO_RESULT", label: "Dyno Result" },
  { value: "PHOTO", label: "Photo" },
];

const currentYear = new Date().getFullYear();

const selectBaseClass =
  "h-8 rounded-md border border-input bg-background px-2.5 py-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors";

export function SearchFilters({
  type,
  filters,
  onFiltersChange,
}: SearchFiltersProps) {
  if (type !== "cars" && type !== "posts") return null;

  function updateCarFilter(key: keyof CarFilters, val: string) {
    onFiltersChange({
      ...filters,
      car: { ...filters.car, [key]: val },
    });
  }

  function updatePostFilter(key: keyof PostFilters, val: string) {
    onFiltersChange({
      ...filters,
      post: { ...filters.post, [key]: val } as PostFilters,
    });
  }

  if (type === "cars") {
    return (
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card/50 p-3">
        <div className="flex items-center gap-2">
          <div className="space-y-1">
            <span className="block text-xs text-muted-foreground">Year from</span>
            <Input
              type="number"
              placeholder="1980"
              min={1900}
              max={currentYear + 1}
              value={filters.car.yearMin}
              onChange={(e) => updateCarFilter("yearMin", e.target.value)}
              className="h-8 w-24 text-sm"
            />
          </div>
          <span className="mt-5 text-muted-foreground text-sm select-none">—</span>
          <div className="space-y-1">
            <span className="block text-xs text-muted-foreground">Year to</span>
            <Input
              type="number"
              placeholder={String(currentYear)}
              min={1900}
              max={currentYear + 1}
              value={filters.car.yearMax}
              onChange={(e) => updateCarFilter("yearMax", e.target.value)}
              className="h-8 w-24 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <span className="block text-xs text-muted-foreground">Make</span>
          <select
            value={filters.car.make || "Any"}
            onChange={(e) =>
              updateCarFilter("make", e.target.value === "Any" ? "" : e.target.value)
            }
            className={`${selectBaseClass} w-40`}
          >
            {COMMON_MAKES.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (type === "posts") {
    return (
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card/50 p-3">
        <div className="space-y-1">
          <span className="block text-xs text-muted-foreground">Post type</span>
          <select
            value={filters.post.postType || "all"}
            onChange={(e) =>
              updatePostFilter("postType", e.target.value === "all" ? "" : e.target.value)
            }
            className={`${selectBaseClass} w-44`}
          >
            <option value="all">All types</option>
            {POST_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return null;
}
