import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

const OTHER_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: authUser.id }, { user2Id: authUser.id }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user1: { select: OTHER_USER_SELECT },
        user2: { select: OTHER_USER_SELECT },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Fetch all unread counts in a single query to avoid N+1
    const conversationIds = conversations.map((c) => c.id);
    const unreadGroups = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversationIds },
        receiverId: authUser.id,
        read: false,
      },
      _count: { id: true },
    });
    const unreadByConvId = new Map(
      unreadGroups.map((g) => [g.conversationId, g._count.id])
    );

    // Attach unread count and normalize the "other user" field
    const result = conversations.map((conv) => {
      const otherUser =
        conv.user1Id === authUser.id ? conv.user2 : conv.user1;

      const unreadCount = unreadByConvId.get(conv.id) ?? 0;

      const { user1, user2, messages, ...rest } = conv;
      return {
        ...rest,
        otherUser,
        lastMessage: messages[0] ?? null,
        unreadCount,
      };
    });

    return Response.json({ conversations: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[GET /api/conversations]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    let body: { userId?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    if (userId === authUser.id) {
      return Response.json(
        { error: "Cannot start a conversation with yourself" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: OTHER_USER_SELECT,
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Always store the lexicographically smaller UUID as user1Id to satisfy @@unique([user1Id, user2Id])
    const [user1Id, user2Id] =
      authUser.id < userId
        ? [authUser.id, userId]
        : [userId, authUser.id];

    const existing = await prisma.conversation.findUnique({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      include: {
        user1: { select: OTHER_USER_SELECT },
        user2: { select: OTHER_USER_SELECT },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (existing) {
      const otherUser =
        existing.user1Id === authUser.id ? existing.user2 : existing.user1;
      const { user1, user2, messages, ...rest } = existing;
      return Response.json({
        conversation: { ...rest, otherUser, lastMessage: messages[0] ?? null },
      });
    }

    const conversation = await prisma.conversation.create({
      data: { user1Id, user2Id },
      include: {
        user1: { select: OTHER_USER_SELECT },
        user2: { select: OTHER_USER_SELECT },
      },
    });

    const otherUser =
      conversation.user1Id === authUser.id
        ? conversation.user2
        : conversation.user1;

    const { user1, user2, ...rest } = conversation;
    return Response.json(
      { conversation: { ...rest, otherUser, lastMessage: null } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/conversations]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
