"use client";

import { useChatDock } from "./chat-dock-context";
import { ChatWindow } from "./chat-window";
import { ChatHead } from "./chat-head";

export function ChatDock() {
  const { openChats } = useChatDock();

  if (openChats.length === 0) return null;

  const expanded = openChats.filter((c) => !c.minimized);
  const minimized = openChats.filter((c) => c.minimized);

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden md:flex items-end gap-3">
      {expanded.map((chat) => (
        <ChatWindow
          key={chat.id}
          conversationId={chat.id}
          index={openChats.findIndex((c) => c.id === chat.id)}
        />
      ))}

      {minimized.length > 0 && (
        <div className="flex flex-col gap-2.5 items-center pb-1">
          {minimized.map((chat) => (
            <ChatHead key={chat.id} conversationId={chat.id} />
          ))}
        </div>
      )}
    </div>
  );
}
