"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, ShoppingBag, Car, UserCircle, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/events", label: "Events", icon: CalendarDays },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  const links = isAuthenticated
    ? [
        { href: "/feed", label: "Feed", icon: Home },
        { href: "/messages", label: "Messages", icon: MessageCircle },
        { href: "/marketplace", label: "Market", icon: ShoppingBag },
        { href: "/garage", label: "Garage", icon: Car },
        {
          href: user ? `/profile/${user.username}` : "/login",
          label: "Profile",
          icon: UserCircle,
        },
      ]
    : [
        ...publicLinks,
        { href: "/login", label: "Login", icon: UserCircle },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-w-0 transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="text-[10px] leading-none truncate">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
