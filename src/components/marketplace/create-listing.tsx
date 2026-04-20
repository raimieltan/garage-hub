"use client";

import { useState, useEffect } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { ImageUpload } from "@/components/upload/image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { MarketplaceListing } from "@/types";

const CURRENT_YEAR = new Date().getFullYear();

const CATEGORIES = [
  { value: "ENGINE", label: "Engine" },
  { value: "EXHAUST", label: "Exhaust" },
  { value: "INTAKE", label: "Intake" },
  { value: "SUSPENSION", label: "Suspension" },
  { value: "BRAKES", label: "Brakes" },
  { value: "WHEELS_TIRES", label: "Wheels & Tires" },
  { value: "EXTERIOR", label: "Exterior" },
  { value: "INTERIOR", label: "Interior" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "DRIVETRAIN", label: "Drivetrain" },
  { value: "FORCED_INDUCTION", label: "Forced Induction" },
  { value: "FUEL", label: "Fuel" },
  { value: "OTHER", label: "Other" },
];

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

interface CreateListingProps {
  onCreated: (listing: MarketplaceListing) => void;
}

interface FormState {
  title: string;
  description: string;
  price: string;
  condition: string;
  category: string;
  location: string;
  carMake: string;
  carModel: string;
  carYear: string;
  photos: string[];
}

function makeEmpty(): FormState {
  return {
    title: "",
    description: "",
    price: "",
    condition: "GOOD",
    category: "OTHER",
    location: "",
    carMake: "",
    carModel: "",
    carYear: "",
    photos: [],
  };
}

export function CreateListing({ onCreated }: CreateListingProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(makeEmpty());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(makeEmpty());
    }
  }, [open]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        condition: form.condition,
        category: form.category,
        location: form.location.trim() || null,
        carMake: form.carMake.trim() || null,
        carModel: form.carModel.trim() || null,
        carYear: form.carYear ? parseInt(form.carYear, 10) : null,
        photos: form.photos.filter((p) => p.trim()),
      };

      const data = await api.post<{ listing: MarketplaceListing }>(
        "/api/marketplace",
        body
      );
      toast.success("Listing created!");
      onCreated(data.listing);
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create listing"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <PlusCircle className="size-4" />
            Create Listing
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Listing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="listing-title"
              className="text-sm font-medium text-muted-foreground"
            >
              Title *
            </label>
            <Input
              id="listing-title"
              placeholder="Garrett GTX3076R Turbocharger"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="listing-desc"
              className="text-sm font-medium text-muted-foreground"
            >
              Description
            </label>
            <Textarea
              id="listing-desc"
              placeholder="Describe your item, include condition details, reason for selling..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              className="resize-none mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="listing-price"
                className="text-sm font-medium text-muted-foreground"
              >
                Price ($) *
              </label>
              <Input
                id="listing-price"
                type="number"
                placeholder="500"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                min={0}
                step={0.01}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="listing-location"
                className="text-sm font-medium text-muted-foreground"
              >
                Location
              </label>
              <Input
                id="listing-location"
                placeholder="Los Angeles, CA"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="listing-condition"
                className="text-sm font-medium text-muted-foreground"
              >
                Condition *
              </label>
              <select
                id="listing-condition"
                value={form.condition}
                onChange={(e) => setField("condition", e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {CONDITIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="listing-category"
                className="text-sm font-medium text-muted-foreground"
              >
                Category *
              </label>
              <select
                id="listing-category"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Separator />

          {/* Car compatibility */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Car Compatibility (optional)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="listing-car-year" className="sr-only">
                  Year
                </label>
                <Input
                  id="listing-car-year"
                  type="number"
                  placeholder="Year"
                  value={form.carYear}
                  onChange={(e) => setField("carYear", e.target.value)}
                  min={1885}
                  max={CURRENT_YEAR + 2}
                  className="text-sm"
                />
              </div>
              <div>
                <label htmlFor="listing-car-make" className="sr-only">
                  Make
                </label>
                <Input
                  id="listing-car-make"
                  placeholder="Make"
                  value={form.carMake}
                  onChange={(e) => setField("carMake", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label htmlFor="listing-car-model" className="sr-only">
                  Model
                </label>
                <Input
                  id="listing-car-model"
                  placeholder="Model"
                  value={form.carModel}
                  onChange={(e) => setField("carModel", e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Photos */}
          <div>
            <span className="text-sm font-medium text-muted-foreground">
              Photos
            </span>
            <div className="mt-2">
              <ImageUpload
                value={form.photos}
                onChange={(urls) => setForm((p) => ({ ...p, photos: urls }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !form.title.trim() || !form.price
              }
            >
              {isSubmitting && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              Create Listing
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
