import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id: conversationId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, user1Id: true, user2Id: true },
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

    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: authUser.id,
        read: false,
      },
      data: { read: true },
    });

    return Response.json({ success: true, count: result.count });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/conversations/[id]/read]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
