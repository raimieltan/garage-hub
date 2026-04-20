"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const MAX_OPEN = 3;
const SESSION_KEY = "chat-dock-open";

export interface OpenChat {
  id: string;
  minimized: boolean;
}

interface ChatDockContextValue {
  openChats: OpenChat[];
  openChat: (conversationId: string) => void;
  closeChat: (conversationId: string) => void;
  minimize: (conversationId: string) => void;
  restore: (conversationId: string) => void;
}

const ChatDockContext = createContext<ChatDockContextValue | null>(null);

function readSession(): OpenChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as OpenChat[]).filter(
      (c) => typeof c.id === "string" && typeof c.minimized === "boolean"
    );
  } catch {
    return [];
  }
}

function writeSession(chats: OpenChat[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(chats));
  } catch {
    /* ignore */
  }
}

// Module-level external store — lets useSyncExternalStore drive hydration
// without a setState-in-effect cascade.
const EMPTY: OpenChat[] = [];
let snapshot: OpenChat[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const stored = readSession();
  if (stored.length > 0) snapshot = stored;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): OpenChat[] {
  ensureHydrated();
  return snapshot;
}

function getServerSnapshot(): OpenChat[] {
  return EMPTY;
}

function commit(next: OpenChat[]) {
  snapshot = next;
  writeSession(next);
  listeners.forEach((cb) => cb());
}

export function ChatDockProvider({ children }: { children: ReactNode }) {
  const openChats = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const openChat = useCallback((id: string) => {
    const prev = snapshot;
    const existing = prev.find((c) => c.id === id);
    if (existing) {
      commit(prev.map((c) => (c.id === id ? { ...c, minimized: false } : c)));
      return;
    }

    const updated = [...prev];
    if (updated.length >= MAX_OPEN) {
      const nonMinimizedIdx = updated.findIndex((c) => !c.minimized);
      updated.splice(nonMinimizedIdx !== -1 ? nonMinimizedIdx : 0, 1);
    }
    commit([...updated, { id, minimized: false }]);
  }, []);

  const closeChat = useCallback((id: string) => {
    commit(snapshot.filter((c) => c.id !== id));
  }, []);

  const minimize = useCallback((id: string) => {
    commit(
      snapshot.map((c) => (c.id === id ? { ...c, minimized: true } : c))
    );
  }, []);

  const restore = useCallback((id: string) => {
    commit(
      snapshot.map((c) => (c.id === id ? { ...c, minimized: false } : c))
    );
  }, []);

  return (
    <ChatDockContext.Provider
      value={{ openChats, openChat, closeChat, minimize, restore }}
    >
      {children}
    </ChatDockContext.Provider>
  );
}

export function useChatDock(): ChatDockContextValue {
  const ctx = useContext(ChatDockContext);
  if (!ctx) throw new Error("useChatDock must be used within ChatDockProvider");
  return ctx;
}
