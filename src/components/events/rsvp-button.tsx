"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, HelpCircle, XCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { RSVP } from "@/types";

interface RSVPButtonProps {
  eventId: string;
  currentRsvp?: RSVP;
  onRsvpChange?: (rsvp: RSVP | null) => void;
}

type RsvpStatus = RSVP["status"];

const STATUS_CONFIG: Record<
  RsvpStatus,
  { label: string; icon: React.ElementType; variant: "default" | "outline" | "secondary" }
> = {
  GOING: { label: "Going", icon: CheckCircle2, variant: "default" },
  MAYBE: { label: "Maybe", icon: HelpCircle, variant: "secondary" },
  NOT_GOING: { label: "Not Going", icon: XCircle, variant: "outline" },
};

export function RSVPButton({
  eventId,
  currentRsvp,
  onRsvpChange,
}: RSVPButtonProps) {
  const { isAuthenticated } = useAuth();
  const [rsvp, setRsvp] = useState<RSVP | undefined>(currentRsvp);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleRsvp(status: RsvpStatus) {
    if (!isAuthenticated) {
      toast.error("Please log in to RSVP");
      return;
    }
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const data = await api.post<{ rsvp: RSVP }>(
        `/api/events/${eventId}/rsvp`,
        { status }
      );
      setRsvp(data.rsvp);
      onRsvpChange?.(data.rsvp);
      toast.success(`RSVP updated: ${STATUS_CONFIG[status].label}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to RSVP");
    } finally {
      setIsProcessing(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <Button variant="outline" disabled>
        Login to RSVP
      </Button>
    );
  }

  const current = rsvp ? STATUS_CONFIG[rsvp.status] : null;
  const CurrentIcon = current?.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-primary px-2.5 py-1 text-sm font-medium text-primary-foreground transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-popup-open:opacity-90"
        disabled={isProcessing}
        aria-label="RSVP options"
      >
        {isProcessing ? (
          <Loader2 className="size-4 animate-spin" />
        ) : CurrentIcon ? (
          <CurrentIcon className="size-4" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        {current?.label ?? "RSVP"}
        <ChevronDown className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(STATUS_CONFIG) as RsvpStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => void handleRsvp(status)}
              className={rsvp?.status === status ? "bg-accent" : ""}
            >
              <Icon className="size-4 mr-2" />
              {config.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
