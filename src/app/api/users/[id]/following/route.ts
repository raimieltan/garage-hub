import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: id },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const following = follows.map((f: (typeof follows)[number]) => f.following);

    return Response.json({ following });
  } catch (error) {
    console.error("[GET /api/users/[id]/following]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
