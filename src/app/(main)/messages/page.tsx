"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ConversationList } from "@/components/messages/conversation-list";
import { MessageThread } from "@/components/messages/message-thread";
import { NewConversation } from "@/components/messages/new-conversation";

export default function MessagesPage() {
  const router = useRouter();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  function handleSelectConversation(id: string) {
    setActiveConversationId(id);
    // On mobile (md breakpoint not reached), navigate to the dedicated thread page.
    // On desktop, the split view handles display — no navigation needed.
    if (window.innerWidth < 768) {
      router.push(`/messages/${id}`);
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your direct conversations
          </p>
        </div>
        <NewConversation />
      </div>

      <Separator />

      {/* Split layout */}
      <div className="flex flex-1 min-h-0 mt-0 border border-border rounded-xl overflow-hidden">
        {/* Conversation list — full on mobile, 1/3 on desktop */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 border-r border-border overflow-y-auto">
          <ConversationList
            activeId={activeConversationId ?? undefined}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Thread area — hidden on mobile, 2/3 on desktop */}
        <div className="hidden md:flex flex-1 flex-col min-w-0">
          {activeConversationId ? (
            <MessageThread conversationId={activeConversationId} />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
              <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <MessageCircle className="size-8 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-muted-foreground">
                Select a conversation
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
