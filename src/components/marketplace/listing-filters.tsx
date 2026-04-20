"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ListingFilters {
  search: string;
  category: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
}

interface ListingFiltersProps {
  onFilterChange: (filters: ListingFilters) => void;
}

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "ENGINE", label: "Engine" },
  { value: "EXHAUST", label: "Exhaust" },
  { value: "SUSPENSION", label: "Suspension" },
  { value: "WHEELS_TIRES", label: "Wheels & Tires" },
  { value: "INTERIOR", label: "Interior" },
  { value: "EXTERIOR", label: "Exterior" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "INTAKE", label: "Intake" },
  { value: "BRAKES", label: "Brakes" },
  { value: "FORCED_INDUCTION", label: "Forced Induction" },
  { value: "DRIVETRAIN", label: "Drivetrain" },
  { value: "FUEL", label: "Fuel" },
  { value: "OTHER", label: "Other" },
];

const CONDITIONS = [
  { value: "", label: "Any Condition" },
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

const DEFAULT_FILTERS: ListingFilters = {
  search: "",
  category: "",
  condition: "",
  minPrice: "",
  maxPrice: "",
};

export function ListingFiltersBar({ onFilterChange }: ListingFiltersProps) {
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function updateFilter<K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K]
  ) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilterChange(next);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    onFilterChange(DEFAULT_FILTERS);
  }

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.condition ||
    filters.minPrice ||
    filters.maxPrice;

  return (
    <div className="space-y-3">
      {/* Main filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search parts..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category dropdown */}
        <select
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
          aria-label="Filter by category"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-40"
        >
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Condition dropdown */}
        <select
          value={filters.condition}
          onChange={(e) => updateFilter("condition", e.target.value)}
          aria-label="Filter by condition"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-36"
        >
          {CONDITIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Toggle advanced */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced((v) => !v)}
          className="gap-2 shrink-0"
          aria-expanded={showAdvanced}
        >
          <SlidersHorizontal className="size-4" />
          Price
        </Button>

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="gap-1.5 text-muted-foreground shrink-0"
          >
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced price filter */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 pl-1">
          <span className="text-sm text-muted-foreground">Price range:</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min $"
              value={filters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
              min={0}
              className="w-24 text-sm"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="number"
              placeholder="Max $"
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              min={0}
              className="w-24 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
