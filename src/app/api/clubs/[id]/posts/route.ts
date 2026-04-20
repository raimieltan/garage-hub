import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const club = await prisma.carClub.findUnique({ where: { id } });
    if (!club) {
      return Response.json({ error: "Club not found" }, { status: 404 });
    }

    const posts = await prisma.clubPost.findMany({
      where: { clubId: id },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return Response.json({ posts });
  } catch (error) {
    console.error("[GET /api/clubs/[id]/posts]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await params;

    const club = await prisma.carClub.findUnique({ where: { id } });
    if (!club) {
      return Response.json({ error: "Club not found" }, { status: 404 });
    }

    // Verify the user is a member of the club
    const membership = await prisma.clubMembership.findUnique({
      where: { clubId_userId: { clubId: id, userId: authUser.id } },
    });

    if (!membership) {
      return Response.json(
        { error: "Forbidden: you must be a member to post in this club" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, photos } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return Response.json({ error: "content is required" }, { status: 400 });
    }

    const post = await prisma.clubPost.create({
      data: {
        clubId: id,
        authorId: authUser.id,
        content: content.trim(),
        photos: Array.isArray(photos) ? photos : [],
      },
    });

    return Response.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/clubs/[id]/posts]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
