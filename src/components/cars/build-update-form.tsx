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
import type { BuildUpdate } from "@/types";

interface BuildUpdateFormProps {
  carId: string;
  existingUpdate?: BuildUpdate;
  onSaved: () => void;
}

interface FormState {
  title: string;
  description: string;
  photos: string[];
}

function makeEmpty(): FormState {
  return { title: "", description: "", photos: [] };
}

function updateToForm(u: BuildUpdate): FormState {
  return { title: u.title, description: u.description, photos: [...u.photos] };
}

export function BuildUpdateForm({
  carId,
  existingUpdate,
  onSaved,
}: BuildUpdateFormProps) {
  const isEditing = !!existingUpdate;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(makeEmpty());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(existingUpdate ? updateToForm(existingUpdate) : makeEmpty());
    }
  }, [open, existingUpdate]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        photos: form.photos.filter((p) => p.trim()),
      };

      if (isEditing) {
        await api.put(`/api/cars/${carId}/build-thread/${existingUpdate.id}`, body);
        toast.success("Build update saved!");
      } else {
        await api.post(`/api/cars/${carId}/build-thread`, body);
        toast.success("Build update added!");
      }

      onSaved();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save update");
    } finally {
      setIsSubmitting(false);
    }
  }

  const trigger = isEditing ? (
    <Button variant="ghost" size="icon" aria-label="Edit update">
      <Pencil className="size-4" />
    </Button>
  ) : (
    <Button className="gap-2">
      <PlusCircle className="size-4" />
      Add Update
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Build Update" : "Add Build Update"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="update-title"
              className="text-sm font-medium text-muted-foreground"
            >
              Title *
            </label>
            <Input
              id="update-title"
              placeholder="Installed new turbo kit"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="update-desc"
              className="text-sm font-medium text-muted-foreground"
            >
              Description *
            </label>
            <Textarea
              id="update-desc"
              placeholder="Describe what you did, challenges, results..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={4}
              className="resize-none mt-1"
              required
            />
          </div>

          <Separator />

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
              disabled={isSubmitting || !form.title.trim() || !form.description.trim()}
            >
              {isSubmitting && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              {isEditing ? "Save Changes" : "Add Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
