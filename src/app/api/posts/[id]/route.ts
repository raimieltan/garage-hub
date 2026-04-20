import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        car: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(authUser && {
          likes: {
            where: { userId: authUser.id },
            select: { id: true },
          },
        }),
      },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    type PostWithLikes = typeof post & { likes?: { id: string }[] };
    const { likes, ...rest } = post as PostWithLikes;
    const formattedPost = {
      ...rest,
      likedByMe: authUser ? (likes?.length ?? 0) > 0 : false,
    };

    return Response.json({ post: formattedPost });
  } catch (error) {
    console.error("[GET /api/posts/[id]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== authUser.id) {
      return Response.json({ error: "Forbidden: you are not the author" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[DELETE /api/posts/[id]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
