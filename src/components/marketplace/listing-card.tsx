"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MarketplaceListing } from "@/types";

interface ListingCardProps {
  listing: MarketplaceListing;
}

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

const CONDITION_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  NEW: "default",
  LIKE_NEW: "default",
  GOOD: "secondary",
  FAIR: "secondary",
  POOR: "destructive",
};

const PHOTO_GRADIENTS = [
  "from-slate-700 via-slate-800 to-slate-900",
  "from-red-900 via-red-800 to-red-950",
  "from-blue-900 via-blue-800 to-blue-950",
  "from-orange-800 via-orange-700 to-orange-950",
  "from-emerald-800 via-emerald-700 to-emerald-950",
  "from-purple-800 via-purple-700 to-purple-950",
];

function getGradient(id: string): string {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PHOTO_GRADIENTS[sum % PHOTO_GRADIENTS.length] ?? PHOTO_GRADIENTS[0];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();
  const gradient = getGradient(listing.id);
  const isPricey = listing.price > 500;
  const formattedPrice = formatPrice(listing.price);

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 hover:shadow-lg py-0 gap-0"
      onClick={() => router.push(`/marketplace/${listing.id}`)}
      role="button"
      tabIndex={0}
      aria-label={`${listing.title} — ${formattedPrice}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/marketplace/${listing.id}`);
        }
      }}
    >
      {/* Photo area */}
      <div
        className={`relative aspect-[4/3] bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
      >
        {listing.photos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-4xl select-none" role="img" aria-label="part">
            🔧
          </span>
        )}

        {/* Condition badge overlay */}
        <div className="absolute top-2 left-2">
          <Badge
            variant={CONDITION_VARIANTS[listing.condition] ?? "secondary"}
            className="text-xs shadow-md"
          >
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </Badge>
        </div>

        {/* Sold overlay */}
        {listing.status === "SOLD" && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Badge className="text-sm px-3 py-1 bg-muted text-muted-foreground">
              Sold
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">
          {listing.title}
        </h3>

        {/* Price */}
        <div>
          {isPricey ? (
            <span className="text-gradient-racing font-bold text-lg tabular-nums">
              {formattedPrice}
            </span>
          ) : (
            <span className="font-bold text-lg tabular-nums text-foreground">
              {formattedPrice}
            </span>
          )}
        </div>

        {/* Category + compatibility */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {listing.category}
          </Badge>
          {(listing.carMake ?? listing.carModel) && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {[listing.carYear, listing.carMake, listing.carModel]
                .filter(Boolean)
                .join(" ")}
            </Badge>
          )}
        </div>

        {/* Seller info */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Avatar className="size-5">
            <AvatarImage
              src={listing.seller.avatarUrl ?? undefined}
              alt={listing.seller.displayName}
            />
            <AvatarFallback className="text-xs">
              {getInitials(listing.seller.displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">
            {listing.seller.displayName}
          </span>
          {listing.location && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground truncate">
                {listing.location}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
