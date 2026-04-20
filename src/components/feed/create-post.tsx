"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Car, Post, User } from "@/types";

interface CreatePostProps {
  onPostCreated?: (post: Post) => void;
}

type PostType = Post["postType"];

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "BUILD_UPDATE", label: "Build Update" },
  { value: "DYNO_RESULT", label: "Dyno Result" },
  { value: "PHOTO", label: "Photo" },
];

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [postType, setPostType] = useState<PostType>("GENERAL");
  const [content, setContent] = useState("");
  const [selectedCarId, setSelectedCarId] = useState<string>("");
  const [dynoHp, setDynoHp] = useState("");
  const [dynoTorque, setDynoTorque] = useState("");
  const [dynoRpm, setDynoRpm] = useState("");
  const [cars, setCars] = useState<Car[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !isAuthenticated) return;

    async function fetchCars() {
      try {
        const data = await api.get<{ user: User }>("/api/auth/me");
        setCars(data.user.cars ?? []);
      } catch {
        // silently fail — car selector stays empty
      }
    }

    void fetchCars();
  }, [open, isAuthenticated]);

  function resetForm() {
    setPostType("GENERAL");
    setContent("");
    setSelectedCarId("");
    setDynoHp("");
    setDynoTorque("");
    setDynoRpm("");
    setPhotos([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        content: content.trim(),
        postType,
        carId: selectedCarId || null,
        photos: photos.length > 0 ? photos : undefined,
      };

      if (postType === "DYNO_RESULT") {
        if (dynoHp) body.dynoHp = Number(dynoHp);
        if (dynoTorque) body.dynoTorque = Number(dynoTorque);
        if (dynoRpm) body.dynoRpm = Number(dynoRpm);
      }

      const data = await api.post<{ post: Post }>("/api/posts", body);
      toast.success("Post created!");
      onPostCreated?.(data.post);
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <PlusCircle className="size-4" />
            Create Post
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post type selector */}
          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground">
              Post Type
            </p>
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPostType(value)}
                >
                  <Badge
                    variant={postType === value ? "default" : "outline"}
                    className="cursor-pointer select-none px-3 py-1"
                  >
                    {label}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Content */}
          <Textarea
            placeholder="Share something with the GarageHub community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="resize-none"
            required
          />

          {/* Photo upload */}
          <ImageUpload value={photos} onChange={setPhotos} />

          {/* Car selector */}
          {cars.length > 0 && (
            <div>
              <label
                htmlFor="car-select"
                className="text-sm font-medium text-muted-foreground"
              >
                Tag a Car (optional)
              </label>
              <select
                id="car-select"
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">No car selected</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.year} {car.make} {car.model}
                    {car.trim ? ` ${car.trim}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dyno fields */}
          {postType === "DYNO_RESULT" && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
              <p className="text-sm font-semibold">Dyno Numbers</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="dyno-hp"
                    className="text-xs text-muted-foreground"
                  >
                    Horsepower
                  </label>
                  <input
                    id="dyno-hp"
                    type="number"
                    placeholder="450"
                    value={dynoHp}
                    onChange={(e) => setDynoHp(e.target.value)}
                    min={0}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dyno-tq"
                    className="text-xs text-muted-foreground"
                  >
                    Torque (lb-ft)
                  </label>
                  <input
                    id="dyno-tq"
                    type="number"
                    placeholder="400"
                    value={dynoTorque}
                    onChange={(e) => setDynoTorque(e.target.value)}
                    min={0}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dyno-rpm"
                    className="text-xs text-muted-foreground"
                  >
                    RPM
                  </label>
                  <input
                    id="dyno-rpm"
                    type="number"
                    placeholder="6500"
                    value={dynoRpm}
                    onChange={(e) => setDynoRpm(e.target.value)}
                    min={0}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              Post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
