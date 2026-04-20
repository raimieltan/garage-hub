"use client";

import { use, useState, useEffect, useCallback } from "react";
import { ArrowLeft, MapPin, Tag, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ListingCard } from "@/components/marketplace/listing-card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { MarketplaceListing } from "@/types";

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
];

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
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ListingDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full aspect-[4/3] rounded-xl max-h-96" />
      <div className="space-y-3">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-9 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [sellerListings, setSellerListings] = useState<MarketplaceListing[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAsSold, setIsMarkingAsSold] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  const fetchListing = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ listing: MarketplaceListing }>(
        `/api/marketplace/${id}`
      );
      setListing(data.listing);

      // Fetch seller's other listings
      const sellerData = await api.get<{
        listings: MarketplaceListing[];
      }>(`/api/marketplace?sellerId=${data.listing.sellerId}&limit=4`);
      setSellerListings(
        sellerData.listings.filter((l) => l.id !== id).slice(0, 3)
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load listing");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchListing();
  }, [fetchListing]);

  async function handleMarkAsSold() {
    if (!listing) return;
    setIsMarkingAsSold(true);
    try {
      const data = await api.put<{ listing: MarketplaceListing }>(
        `/api/marketplace/${listing.id}`,
        { status: "SOLD" }
      );
      setListing(data.listing);
      toast.success("Listing marked as sold!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update listing"
      );
    } finally {
      setIsMarkingAsSold(false);
    }
  }

  const isSeller = !!(currentUser && listing && currentUser.id === listing.sellerId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <ListingDetailSkeleton />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">Listing not found.</p>
        <Button variant="outline" onClick={() => router.push("/marketplace")}>
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const isPricey = listing.price > 500;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 -ml-2"
        onClick={() => router.push("/marketplace")}
      >
        <ArrowLeft className="size-4" />
        Marketplace
      </Button>

      {/* Photo section */}
      <div className="space-y-2">
        <div
          className={`w-full aspect-[4/3] max-h-96 rounded-xl overflow-hidden bg-gradient-to-br ${PHOTO_GRADIENTS[activePhoto % PHOTO_GRADIENTS.length]} flex items-center justify-center relative`}
        >
          {listing.photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.photos[activePhoto]}
              alt={`${listing.title} photo ${activePhoto + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-6xl select-none" role="img" aria-label="part">
              🔧
            </span>
          )}

          {listing.status === "SOLD" && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <Badge className="text-base px-4 py-2 bg-muted text-muted-foreground">
                Sold
              </Badge>
            </div>
          )}
        </div>

        {/* Photo thumbnails */}
        {listing.photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {listing.photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`size-14 rounded-md overflow-hidden shrink-0 border-2 transition-colors ${
                  activePhoto === i
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground"
                }`}
                aria-label={`Photo ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title and price */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold leading-snug">{listing.title}</h1>
          {isSeller && listing.status === "ACTIVE" && (
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/marketplace/${listing.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleMarkAsSold()}
                disabled={isMarkingAsSold}
              >
                {isMarkingAsSold ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="size-4 mr-1.5" />
                    Mark as Sold
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {isPricey ? (
          <p className="text-gradient-racing font-bold text-3xl tabular-nums">
            {formatPrice(listing.price)}
          </p>
        ) : (
          <p className="font-bold text-3xl tabular-nums">
            {formatPrice(listing.price)}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={CONDITION_VARIANTS[listing.condition] ?? "secondary"}
          >
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Tag className="size-3" />
            {listing.category}
          </Badge>
          {listing.location && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <MapPin className="size-3" />
              {listing.location}
            </Badge>
          )}
        </div>

        {/* Car compatibility */}
        {(listing.carMake ?? listing.carModel) && (
          <p className="text-sm text-muted-foreground">
            Fits:{" "}
            <span className="font-medium text-foreground">
              {[listing.carYear, listing.carMake, listing.carModel]
                .filter(Boolean)
                .join(" ")}
            </span>
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Listed {formatDate(listing.createdAt)}
        </p>
      </div>

      <Separator />

      {/* Description */}
      {listing.description && (
        <div className="space-y-2">
          <h2 className="font-semibold">Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {listing.description}
          </p>
        </div>
      )}

      <Separator />

      {/* Seller info card */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Seller
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity w-fit"
            onClick={() => router.push(`/profile/${listing.seller.username}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                router.push(`/profile/${listing.seller.username}`);
            }}
            aria-label={`View ${listing.seller.displayName}'s profile`}
          >
            <Avatar className="size-10">
              <AvatarImage
                src={listing.seller.avatarUrl ?? undefined}
                alt={listing.seller.displayName}
              />
              <AvatarFallback>
                {getInitials(listing.seller.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{listing.seller.displayName}</p>
              <p className="text-sm text-muted-foreground">
                @{listing.seller.username}
              </p>
            </div>
          </div>
          {listing.seller.bio && (
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
              {listing.seller.bio}
            </p>
          )}
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => router.push(`/profile/${listing.seller.username}`)}
          >
            View Profile
          </Button>
        </CardContent>
      </Card>

      {/* Seller's other listings */}
      {sellerListings.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">
            More from {listing.seller.displayName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sellerListings.map((other) => (
              <ListingCard key={other.id} listing={other} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
