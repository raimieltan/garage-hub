import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id: conversationId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: { select: USER_SELECT },
        user2: { select: USER_SELECT },
      },
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant =
      conversation.user1Id === authUser.id ||
      conversation.user2Id === authUser.id;

    if (!isParticipant) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json({ conversation });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[GET /api/conversations/[id]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
