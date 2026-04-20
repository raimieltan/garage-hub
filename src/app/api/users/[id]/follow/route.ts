import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id: targetUserId } = await params;

    if (authUser.id === targetUserId) {
      return Response.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: authUser.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return Response.json({ following: false });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: authUser.id,
          followingId: targetUserId,
        },
      });
      return Response.json({ following: true });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/users/[id]/follow]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
