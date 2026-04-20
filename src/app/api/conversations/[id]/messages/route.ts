import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

const PAGE_SIZE = 50;

const SENDER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

async function resolveConversationParticipant(
  conversationId: string,
  authUserId: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, user1Id: true, user2Id: true },
  });

  if (!conversation) return { conversation: null, otherUserId: null };

  const isParticipant =
    conversation.user1Id === authUserId || conversation.user2Id === authUserId;

  if (!isParticipant) return { conversation: null, otherUserId: null };

  const otherUserId =
    conversation.user1Id === authUserId
      ? conversation.user2Id
      : conversation.user1Id;

  return { conversation, otherUserId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id: conversationId } = await params;

    const { conversation } = await resolveConversationParticipant(
      conversationId,
      authUser.id
    );

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found or forbidden" },
        { status: 404 }
      );
    }

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor") ?? undefined;

    const messages = await prisma.message.findMany({
      take: PAGE_SIZE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      where: { conversationId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        sender: { select: SENDER_SELECT },
      },
    });

    const hasMore = messages.length > PAGE_SIZE;
    const page = hasMore ? messages.slice(0, PAGE_SIZE) : messages;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return Response.json({ messages: page, nextCursor });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[GET /api/conversations/[id]/messages]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id: conversationId } = await params;

    const { conversation, otherUserId } = await resolveConversationParticipant(
      conversationId,
      authUser.id
    );

    if (!conversation || !otherUserId) {
      return Response.json(
        { error: "Conversation not found or forbidden" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return Response.json({ error: "content is required" }, { status: 400 });
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: authUser.id,
          receiverId: otherUserId,
          content: content.trim(),
          read: false,
        },
        include: {
          sender: { select: SENDER_SELECT },
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/conversations/[id]/messages]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
