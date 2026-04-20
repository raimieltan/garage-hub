"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/upload/image-upload";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface EditProfileDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Partial<Pick<User, "displayName" | "bio" | "avatarUrl">>) => void;
}

export function EditProfileDialog({
  user,
  open,
  onOpenChange,
  onSaved,
}: EditProfileDialogProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset to current user values on close
      setDisplayName(user.displayName);
      setBio(user.bio ?? "");
      setAvatarUrl(user.avatarUrl ?? null);
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      toast.error("Display name cannot be empty");
      return;
    }

    // Build patch body with only changed fields
    const body: Record<string, string | null> = {};
    if (trimmedName !== user.displayName) body.displayName = trimmedName;

    const newBio = bio.trim() || null;
    const oldBio = user.bio ?? null;
    if (newBio !== oldBio) body.bio = newBio;

    const oldAvatar = user.avatarUrl ?? null;
    if (avatarUrl !== oldAvatar) body.avatarUrl = avatarUrl;

    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/api/users/${user.id}`, body);
      toast.success("Profile updated");
      onSaved({
        displayName: trimmedName,
        bio: newBio,
        avatarUrl,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground">
              Avatar
            </p>
            <ImageUpload
              value={avatarUrl ? [avatarUrl] : []}
              onChange={(urls) => setAvatarUrl(urls[0] ?? null)}
              maxFiles={1}
            />
          </div>

          {/* Display name */}
          <div>
            <label
              htmlFor="edit-display-name"
              className="text-sm font-medium text-muted-foreground"
            >
              Display Name
            </label>
            <Input
              id="edit-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1.5"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="edit-bio"
              className="text-sm font-medium text-muted-foreground"
            >
              Bio
            </label>
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={3}
              className="mt-1.5 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !displayName.trim()}>
              {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
