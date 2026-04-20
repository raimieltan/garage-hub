"use client";

import { cn } from "@/lib/utils";

// Racing stripe divider
export function RacingStripe({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 my-4", className)}>
      <div className="h-[2px] flex-1 racing-gradient opacity-60" />
      <div className="h-[3px] w-8 racing-gradient" />
      <div className="h-[2px] flex-1 racing-gradient opacity-60" />
    </div>
  );
}

// Stat display (like speedometer reading)
export function StatDisplay({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="text-center p-3">
      <div className="text-2xl font-bold font-mono text-gradient-racing">
        {value}
        {unit && <span className="text-sm ml-1 text-muted-foreground">{unit}</span>}
      </div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

// Dyno result display card
export function DynoDisplay({
  hp,
  torque,
  rpm,
}: {
  hp: number;
  torque: number;
  rpm?: number;
}) {
  return (
    <div className="rounded-lg border border-primary/20 bg-card/50 p-4 carbon-fiber">
      <div className="flex justify-around">
        <StatDisplay label="Horsepower" value={hp} unit="HP" />
        <div className="w-px bg-border" />
        <StatDisplay label="Torque" value={torque} unit="FT-LB" />
        {rpm && (
          <>
            <div className="w-px bg-border" />
            <StatDisplay label="Peak RPM" value={rpm.toLocaleString()} unit="RPM" />
          </>
        )}
      </div>
    </div>
  );
}

// Post type badge with racing styling
export function PostTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    GENERAL: "bg-secondary text-secondary-foreground",
    BUILD_UPDATE: "bg-primary/20 text-primary border border-primary/30",
    DYNO_RESULT: "racing-gradient text-white",
    PHOTO: "bg-accent/20 text-accent border border-accent/30",
  };

  const labels: Record<string, string> = {
    GENERAL: "General",
    BUILD_UPDATE: "Build Update",
    DYNO_RESULT: "Dyno Result",
    PHOTO: "Photo",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[type] || styles.GENERAL
      )}
    >
      {labels[type] || type}
    </span>
  );
}

// Car badge
export function CarBadge({
  year,
  make,
  model,
}: {
  year: number;
  make: string;
  model: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground border border-border">
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M5 17h14M6 9l2-4h8l2 4M4 17V9h16v8M7 17v2M17 17v2" />
      </svg>
      {year} {make} {model}
    </span>
  );
}

// Garage placeholder for car without photos
export function CarPhotoPlaceholder({ make }: { make: string }) {
  // Deterministic hue based on make name
  const hue = make.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="aspect-video rounded-lg flex items-center justify-center text-4xl"
      style={{
        background: `linear-gradient(135deg, oklch(0.25 0.05 ${hue}), oklch(0.15 0.03 ${hue}))`,
      }}
    >
      <span className="opacity-50">&#x1F3CE;</span>
    </div>
  );
}
