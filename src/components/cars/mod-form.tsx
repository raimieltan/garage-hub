"use client";

import { useState, useEffect } from "react";
import { Loader2, PlusCircle, Pencil } from "lucide-react";
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
import type { CarMod } from "@/types";

const MOD_CATEGORIES = [
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
] as const;

interface ModFormProps {
  carId: string;
  existingMod?: CarMod;
  onSaved: () => void;
}

interface FormState {
  category: string;
  partName: string;
  brand: string;
  price: string;
  installDate: string;
  notes: string;
}

function makeEmpty(): FormState {
  return {
    category: "ENGINE",
    partName: "",
    brand: "",
    price: "",
    installDate: "",
    notes: "",
  };
}

function modToForm(mod: CarMod): FormState {
  return {
    category: mod.category,
    partName: mod.partName,
    brand: mod.brand ?? "",
    price: mod.price?.toString() ?? "",
    installDate: mod.installDate ? mod.installDate.split("T")[0] ?? "" : "",
    notes: mod.notes ?? "",
  };
}

export function ModForm({ carId, existingMod, onSaved }: ModFormProps) {
  const isEditing = !!existingMod;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(makeEmpty());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(existingMod ? modToForm(existingMod) : makeEmpty());
    }
  }, [open, existingMod]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.partName.trim()) {
      toast.error("Part name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        category: form.category,
        partName: form.partName.trim(),
        brand: form.brand.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        installDate: form.installDate || null,
        notes: form.notes.trim() || null,
      };

      if (isEditing) {
        await api.put(`/api/cars/${carId}/mods/${existingMod.id}`, body);
        toast.success("Mod updated!");
      } else {
        await api.post(`/api/cars/${carId}/mods`, body);
        toast.success("Mod added!");
      }

      onSaved();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save mod");
    } finally {
      setIsSubmitting(false);
    }
  }

  const trigger = isEditing ? (
    <Button variant="ghost" size="icon" aria-label="Edit mod">
      <Pencil className="size-4" />
    </Button>
  ) : (
    <Button className="gap-2">
      <PlusCircle className="size-4" />
      Add Mod
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Mod" : "Add Mod"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="mod-category"
              className="text-sm font-medium text-muted-foreground"
            >
              Category *
            </label>
            <select
              id="mod-category"
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {MOD_CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="mod-part"
              className="text-sm font-medium text-muted-foreground"
            >
              Part Name *
            </label>
            <Input
              id="mod-part"
              placeholder="Garrett GTX3076R Turbocharger"
              value={form.partName}
              onChange={(e) => setField("partName", e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="mod-brand"
                className="text-sm font-medium text-muted-foreground"
              >
                Brand
              </label>
              <Input
                id="mod-brand"
                placeholder="Garrett"
                value={form.brand}
                onChange={(e) => setField("brand", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="mod-price"
                className="text-sm font-medium text-muted-foreground"
              >
                Price ($)
              </label>
              <Input
                id="mod-price"
                type="number"
                placeholder="1200"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                min={0}
                step={0.01}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="mod-date"
              className="text-sm font-medium text-muted-foreground"
            >
              Install Date
            </label>
            <Input
              id="mod-date"
              type="date"
              value={form.installDate}
              onChange={(e) => setField("installDate", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="mod-notes"
              className="text-sm font-medium text-muted-foreground"
            >
              Notes
            </label>
            <Textarea
              id="mod-notes"
              placeholder="Additional details, part numbers, dyno results..."
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={3}
              className="resize-none mt-1"
            />
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.partName.trim()}
            >
              {isSubmitting && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              {isEditing ? "Save Changes" : "Add Mod"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
