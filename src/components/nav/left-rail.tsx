"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Car,
  CalendarDays,
  Flag,
  Home,
  MessageCircle,
  Search,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { Car as CarType } from "@/types";

const NAV_ITEMS: {
  href: string;
  label: string;
  meta: string;
  Icon: typeof Home;
}[] = [
  { href: "/feed", label: "Feed", meta: "LIVE", Icon: Home },
  { href: "/garage", label: "My Garage", meta: "GRG", Icon: Car },
  { href: "/events", label: "Events", meta: "MT", Icon: CalendarDays },
  { href: "/clubs", label: "Clubs", meta: "CLB", Icon: Users },
  { href: "/marketplace", label: "Marketplace", meta: "MKT", Icon: ShoppingBag },
  { href: "/messages", label: "Messages", meta: "DM", Icon: MessageCircle },
  { href: "/search", label: "Search", meta: "QRY", Icon: Search },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SectionHeader({
  index,
  label,
  title,
}: {
  index: string;
  label: string;
  title: string;
}) {
  return (
    <div>
      <div className="pit-index">
        <span className="pit-index__num">{index}</span>
        <span>{label}</span>
        <span className="pit-index__rule" />
      </div>
      <h3 className="mt-1.5 font-display text-[22px] leading-tight italic text-foreground">
        {title}
      </h3>
    </div>
  );
}

export function LeftRail() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [cars, setCars] = useState<CarType[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingCars(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingCars(true);
      try {
        const data = await api.get<{ cars: CarType[] }>(
          `/api/users/${user.id}/cars`
        );
        if (!cancelled) setCars(data.cars ?? []);
      } catch {
        if (!cancelled) setCars([]);
      } finally {
        if (!cancelled) setLoadingCars(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="flex flex-col gap-7 pb-10">
      {/* Profile card */}
      {isAuthenticated && user ? (
        <Link
          href={`/profile/${user.username}`}
          className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/60 bg-card p-3 transition hover:border-primary/50 hover:bg-card/80"
        >
          <span className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-primary via-accent to-transparent opacity-70" />
          <Avatar className="size-11 ring-1 ring-border">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            ) : null}
            <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">
              {user.displayName}
            </div>
            <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              @{user.username}
            </div>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      ) : (
        <Link
          href="/login"
          className="group flex items-center gap-3 rounded-xl border border-dashed border-border p-3 transition hover:border-primary/50"
        >
          <Flag className="size-5 text-primary" />
          <div className="flex-1 text-sm">
            <div className="font-semibold text-foreground">Sign in</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Pit access required
            </div>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
        </Link>
      )}

      {/* Section 01 — Pit Lane (primary nav) */}
      <section className="flex flex-col gap-3">
        <SectionHeader index="01" label="Pit Lane" title="Navigate" />
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, meta, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg pl-4 pr-2 py-2 text-sm transition",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full transition",
                    active
                      ? "bg-primary shadow-[0_0_10px_var(--primary)]"
                      : "bg-transparent group-hover:bg-border"
                  )}
                />
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="flex-1 font-medium tracking-tight">
                  {label}
                </span>
                <span
                  className={cn(
                    "font-mono text-[9px] tracking-[0.18em] transition",
                    active
                      ? "text-accent"
                      : "text-muted-foreground/50 group-hover:text-muted-foreground"
                  )}
                >
                  {meta}
                </span>
              </Link>
            );
          })}
        </nav>
      </section>

      {/* Section 02 — Garage shortcuts */}
      {isAuthenticated && (
        <section className="flex flex-col gap-3">
          <SectionHeader
            index="02"
            label={`Stable · ${cars.length.toString().padStart(2, "0")}`}
            title="Your garage"
          />
          <div className="flex flex-col gap-1">
            {loadingCars ? (
              <>
                <div className="h-14 animate-pulse rounded-lg bg-muted/60" />
                <div className="h-14 animate-pulse rounded-lg bg-muted/40" />
              </>
            ) : cars.length === 0 ? (
              <Link
                href="/garage"
                className="group flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <span className="font-medium">+ Add your first build</span>
                <ArrowUpRight className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                {cars.slice(0, 4).map((car, idx) => (
                  <Link
                    key={car.id}
                    href={`/cars/${car.id}`}
                    className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-muted"
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      {car.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={car.photos[0]}
                          alt={`${car.make} ${car.model}`}
                          className="size-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="size-full bg-gradient-to-br from-primary/25 via-transparent to-accent/20" />
                      )}
                      {car.isFeatured && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {car.year} {car.make}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {car.model}
                        {car.trim ? ` · ${car.trim}` : ""}
                      </div>
                    </div>
                    <span className="font-mono text-[9px] tabular-nums text-muted-foreground/60">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </Link>
                ))}
                <Link
                  href="/garage"
                  className="group mt-1 flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground transition hover:text-primary"
                >
                  <span>View all</span>
                  <ArrowUpRight className="size-3 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>
        </section>
      )}

      {/* Section 03 — Footer index */}
      <div className="mt-2">
        <div className="pit-index px-1">
          <span className="pit-index__num">03</span>
          <span className="pit-index__rule" />
          <span>Garagehub · v0.1</span>
        </div>
        <div className="checker-strip mt-3 rounded-sm" />
      </div>
    </div>
  );
}
