import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id: postId } = await params;

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: authUser.id,
        },
      },
    });

    let liked: boolean;

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      liked = false;
    } else {
      await prisma.like.create({
        data: {
          postId,
          userId: authUser.id,
        },
      });
      liked = true;
    }

    const likeCount = await prisma.like.count({ where: { postId } });

    return Response.json({ liked, likeCount });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/posts/[id]/like]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
