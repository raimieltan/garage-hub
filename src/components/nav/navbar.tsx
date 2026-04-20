"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flag, Home, CalendarDays, Car, LogOut, User, Search, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/nav/notification-bell";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navLinks = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/events", label: "Events", icon: CalendarDays },
];

const authNavLinks = [
  ...navLinks,
  { href: "/garage", label: "My Garage", icon: Car },
  { href: "/search", label: "Search", icon: Search },
];

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = isAuthenticated ? authNavLinks : navLinks;

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href={isAuthenticated ? "/feed" : "/"}
          className="flex items-center gap-2 font-bold text-foreground"
        >
          <Flag className="size-5 text-primary" />
          <span className="hidden sm:inline">GarageHub</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated && user ? (
            <>
              <Link
                href="/messages"
                aria-label="Messages"
                className={cn(
                  "flex items-center rounded-lg p-1.5 text-sm font-medium transition-colors",
                  pathname === "/messages" || pathname.startsWith("/messages/")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <MessageCircle className="size-5" />
              </Link>
              <NotificationBell />
            </>
          ) : null}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="User menu"
              >
                <Avatar>
                  {user.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                  )}
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {user.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{user.username}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(`/profile/${user.username}`)}
                  className="cursor-pointer"
                >
                  <User className="size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/garage")}
                  className="cursor-pointer"
                >
                  <Car className="size-4" />
                  My Garage
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                Login
              </Button>
              <Button size="sm" onClick={() => router.push("/register")}>
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
