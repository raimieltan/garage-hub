"use client";

import { useState, useEffect } from "react";
import { Loader2, PlusCircle, Pencil } from "lucide-react";
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
import type { Car } from "@/types";

interface CarFormProps {
  car?: Car;
  onSaved?: (car: Car) => void;
}

interface CarFormState {
  year: string;
  make: string;
  model: string;
  trim: string;
  description: string;
  horsepower: string;
  isFeatured: boolean;
  photos: string[];
}

// Current year used for default year value and max validation.
// Computed at call-time (inside the component) rather than at module
// evaluation so it is always fresh and avoids a potential SSR/client mismatch
// when the module is pre-evaluated on the server.
function makeEmptyForm(): CarFormState {
  return {
    year: new Date().getFullYear().toString(),
    make: "",
    model: "",
    trim: "",
    description: "",
    horsepower: "",
    isFeatured: false,
    photos: [],
  };
}

const EMPTY_FORM = makeEmptyForm();

function carToFormState(car: Car): CarFormState {
  return {
    year: car.year.toString(),
    make: car.make,
    model: car.model,
    trim: car.trim ?? "",
    description: car.description ?? "",
    horsepower: car.horsepower?.toString() ?? "",
    isFeatured: car.isFeatured,
    photos: [...car.photos],
  };
}

export function CarForm({ car, onSaved }: CarFormProps) {
  const isEditing = !!car;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CarFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(car ? carToFormState(car) : makeEmptyForm());
    }
  }, [open, car]);

  function setField<K extends keyof CarFormState>(
    key: K,
    value: CarFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const yearNum = parseInt(form.year, 10);
    if (isNaN(yearNum) || yearNum < 1885 || yearNum > new Date().getFullYear() + 2) {
      toast.error("Please enter a valid year");
      return;
    }
    if (!form.make.trim() || !form.model.trim()) {
      toast.error("Make and model are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        year: yearNum,
        make: form.make.trim(),
        model: form.model.trim(),
        trim: form.trim.trim() || null,
        description: form.description.trim() || null,
        horsepower: form.horsepower ? parseInt(form.horsepower, 10) : null,
        isFeatured: form.isFeatured,
        photos: form.photos,
      };

      let saved: Car;
      if (isEditing) {
        const data = await api.put<{ car: Car }>(`/api/cars/${car.id}`, body);
        saved = data.car;
        toast.success("Car updated!");
      } else {
        const data = await api.post<{ car: Car }>("/api/cars", body);
        saved = data.car;
        toast.success("Car added to garage!");
      }

      onSaved?.(saved);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save car");
    } finally {
      setIsSubmitting(false);
    }
  }

  const triggerButton = isEditing ? (
    <Button variant="ghost" size="icon" aria-label="Edit car">
      <Pencil className="size-4" />
    </Button>
  ) : (
    <Button className="gap-2">
      <PlusCircle className="size-4" />
      Add Car
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerButton} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Car" : "Add a Car"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="car-year"
                className="text-sm font-medium text-muted-foreground"
              >
                Year *
              </label>
              <Input
                id="car-year"
                type="number"
                placeholder="2024"
                value={form.year}
                onChange={(e) => setField("year", e.target.value)}
                min={1885}
                max={new Date().getFullYear() + 2}
                required
                className="mt-1"
                suppressHydrationWarning
              />
            </div>
            <div>
              <label
                htmlFor="car-hp"
                className="text-sm font-medium text-muted-foreground"
              >
                Horsepower
              </label>
              <Input
                id="car-hp"
                type="number"
                placeholder="450"
                value={form.horsepower}
                onChange={(e) => setField("horsepower", e.target.value)}
                min={1}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="car-make"
              className="text-sm font-medium text-muted-foreground"
            >
              Make *
            </label>
            <Input
              id="car-make"
              placeholder="Toyota"
              value={form.make}
              onChange={(e) => setField("make", e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="car-model"
              className="text-sm font-medium text-muted-foreground"
            >
              Model *
            </label>
            <Input
              id="car-model"
              placeholder="Supra"
              value={form.model}
              onChange={(e) => setField("model", e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="car-trim"
              className="text-sm font-medium text-muted-foreground"
            >
              Trim
            </label>
            <Input
              id="car-trim"
              placeholder="GR 3.0 Premium"
              value={form.trim}
              onChange={(e) => setField("trim", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="car-desc"
              className="text-sm font-medium text-muted-foreground"
            >
              Description
            </label>
            <Textarea
              id="car-desc"
              placeholder="Tell the community about your build..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              className="resize-none mt-1"
            />
          </div>

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

          <Separator />

          <div className="flex items-center gap-2">
            <input
              id="car-featured"
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setField("isFeatured", e.target.checked)}
              className="size-4 accent-primary"
            />
            <label
              htmlFor="car-featured"
              className="text-sm font-medium cursor-pointer"
            >
              Feature this car on my profile
            </label>
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
              disabled={isSubmitting || !form.make.trim() || !form.model.trim()}
            >
              {isSubmitting && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              {isEditing ? "Save Changes" : "Add Car"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
