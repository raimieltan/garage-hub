"use client";

import { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Event } from "@/types";

interface CreateEventProps {
  onEventCreated?: (event: Event) => void;
}

interface EventFormState {
  title: string;
  description: string;
  location: string;
  date: string;
}

const EMPTY_FORM: EventFormState = {
  title: "",
  description: "",
  location: "",
  date: "",
};

export function CreateEvent({ onEventCreated }: CreateEventProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof EventFormState>(
    key: K,
    value: EventFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Event title is required");
      return;
    }
    if (!form.location.trim()) {
      toast.error("Location is required");
      return;
    }
    if (!form.date) {
      toast.error("Date and time are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.post<{ event: Event }>("/api/events", {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        date: new Date(form.date).toISOString(),
        ...(coverImageUrl != null ? { coverImageUrl } : {}),
      });

      toast.success("Event created!");
      onEventCreated?.(data.event);
      setOpen(false);
      setForm(EMPTY_FORM);
      setCoverImageUrl(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create event"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <PlusCircle className="size-4" />
            Create Event
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create an Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="event-title"
              className="text-sm font-medium text-muted-foreground"
            >
              Title *
            </label>
            <Input
              id="event-title"
              placeholder="Cars & Coffee at Sunrise Motorsport Park"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="event-location"
              className="text-sm font-medium text-muted-foreground"
            >
              Location *
            </label>
            <Input
              id="event-location"
              placeholder="123 Motorsport Blvd, Austin, TX"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="event-date"
              className="text-sm font-medium text-muted-foreground"
            >
              Date & Time *
            </label>
            <Input
              id="event-date"
              type="datetime-local"
              value={form.date}
              onChange={(e) => setField("date", e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="event-desc"
              className="text-sm font-medium text-muted-foreground"
            >
              Description
            </label>
            <Textarea
              id="event-desc"
              placeholder="Tell people what to expect at this event..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={4}
              className="resize-none mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Cover Image
            </label>
            <div className="mt-2">
              <ImageUpload
                value={coverImageUrl ? [coverImageUrl] : []}
                onChange={(urls) => setCoverImageUrl(urls[0] ?? null)}
                maxFiles={1}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setForm(EMPTY_FORM);
                setCoverImageUrl(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !form.title.trim() ||
                !form.location.trim() ||
                !form.date
              }
            >
              {isSubmitting && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
