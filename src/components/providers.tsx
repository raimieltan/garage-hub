"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import { ChatDockProvider } from "@/components/chat-dock/chat-dock-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <AuthProvider>
        <ChatDockProvider>{children}</ChatDockProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
