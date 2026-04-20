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
      where: { followingId: id },
      include: {
        follower: {
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

    const followers = follows.map((f: (typeof follows)[number]) => f.follower);

    return Response.json({ followers });
  } catch (error) {
    console.error("[GET /api/users/[id]/followers]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
