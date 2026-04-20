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
interface ClubApiResponse {
  id: string;
  name: string;
  description: string;
  coverImage: string | null;
  creatorId: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  memberCount: number;
  createdAt: string;
}

interface CreateClubProps {
  onClubCreated?: (club: ClubApiResponse) => void;
}

interface FormState {
  name: string;
  description: string;
}

const EMPTY_FORM: FormState = { name: "", description: "" };

export function CreateClub({ onClubCreated }: CreateClubProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Club name is required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.post<{ club: ClubApiResponse }>("/api/clubs", {
        name: form.name.trim(),
        description: form.description.trim(),
        ...(coverImage != null ? { coverImage } : {}),
      });

      toast.success("Club created!");
      onClubCreated?.(data.club);
      setOpen(false);
      setForm(EMPTY_FORM);
      setCoverImage(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create club");
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
            Create Club
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Car Club</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="club-name"
              className="text-sm font-medium text-muted-foreground"
            >
              Club Name *
            </label>
            <Input
              id="club-name"
              placeholder="JDM Legends of Austin"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="club-description"
              className="text-sm font-medium text-muted-foreground"
            >
              Description *
            </label>
            <Textarea
              id="club-description"
              placeholder="Tell people what your club is about..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={4}
              className="resize-none mt-1"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Cover Image
            </label>
            <div className="mt-2">
              <ImageUpload
                value={coverImage ? [coverImage] : []}
                onChange={(urls) => setCoverImage(urls[0] ?? null)}
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
                setCoverImage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !form.name.trim() ||
                !form.description.trim()
              }
            >
              {isSubmitting && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              Create Club
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
