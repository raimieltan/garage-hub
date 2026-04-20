"use client";

import { useState } from "react";
import { UserCheck, UserPlus, Loader2, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import type { User } from "@/types";

interface ProfileHeaderProps {
  user: User;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  onProfileUpdated?: (updated: Partial<Pick<User, "displayName" | "bio" | "avatarUrl">>) => void;
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileHeader({
  user,
  isFollowing: initialIsFollowing = false,
  onFollowChange,
  onProfileUpdated,
}: ProfileHeaderProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(
    user._count?.followers ?? 0
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const isOwnProfile = currentUser?.id === user.id;

  async function handleFollowToggle() {
    if (!isAuthenticated) {
      toast.error("Please log in to follow users");
      return;
    }
    if (isProcessing) return;

    setIsProcessing(true);
    const prevFollowing = isFollowing;
    const prevCount = followerCount;

    // Optimistic update
    setIsFollowing(!isFollowing);
    setFollowerCount(isFollowing ? followerCount - 1 : followerCount + 1);

    try {
      await api.post(`/api/users/${user.id}/follow`);
      const newFollowing = !prevFollowing;
      onFollowChange?.(newFollowing);
    } catch (err) {
      // Revert
      setIsFollowing(prevFollowing);
      setFollowerCount(prevCount);
      toast.error(err instanceof Error ? err.message : "Failed to update follow");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <Avatar className="size-20 shrink-0 border-2 border-border">
          {user.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          )}
          <AvatarFallback className="text-2xl font-semibold">
            {getInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold leading-tight">
                {user.displayName}
              </h1>
              <p className="text-muted-foreground text-sm">@{user.username}</p>
            </div>
            {isOwnProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="shrink-0 gap-1.5"
              >
                <Pencil className="size-3.5" />
                Edit Profile
              </Button>
            ) : (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollowToggle}
                disabled={isProcessing}
                className="shrink-0 gap-1.5"
              >
                {isProcessing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserCheck className="size-3.5" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3.5" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>

          {user.bio && (
            <p className="text-sm mt-2 whitespace-pre-wrap">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="text-center">
              <span className="font-bold tabular-nums">
                {user._count?.posts ?? 0}
              </span>
              <span className="text-muted-foreground ml-1">posts</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="text-center">
              <span className="font-bold tabular-nums">{followerCount}</span>
              <span className="text-muted-foreground ml-1">followers</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="text-center">
              <span className="font-bold tabular-nums">
                {user._count?.following ?? 0}
              </span>
              <span className="text-muted-foreground ml-1">following</span>
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          user={user}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={(updated) => {
            onProfileUpdated?.(updated);
          }}
        />
      )}
    </div>
  );
}
