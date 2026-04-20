import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getAuthUser, AuthError } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get optional auth user to determine membership status
    const authUser = await getAuthUser(request);

    const club = await prisma.carClub.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        memberships: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        clubPosts: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            content: true,
            photos: true,
            createdAt: true,
            authorId: true,
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
        _count: { select: { memberships: true } },
      },
    });

    if (!club) {
      return Response.json({ error: "Club not found" }, { status: 404 });
    }

    const { _count, ...clubData } = club;

    let isMember = false;
    let membershipRole: string | null = null;
    if (authUser) {
      const membership = club.memberships.find((m) => m.userId === authUser.id);
      if (membership) {
        isMember = true;
        membershipRole = membership.role;
      }
    }

    return Response.json({
      club: {
        ...clubData,
        memberCount: _count.memberships,
      },
      isMember,
      membershipRole,
    });
  } catch (error) {
    console.error("[GET /api/clubs/[id]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
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

    if (club.creatorId !== authUser.id) {
      return Response.json({ error: "Forbidden: only the club creator can update it" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, coverImage } = body;

    const updated = await prisma.carClub.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(coverImage !== undefined && { coverImage: coverImage ? String(coverImage) : null }),
      },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { memberships: true } },
      },
    });

    const { _count, ...clubData } = updated;

    return Response.json({ club: { ...clubData, memberCount: _count.memberships } });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    if ((error as { code?: string }).code === "P2002") {
      return Response.json({ error: "A club with that name already exists" }, { status: 409 });
    }
    console.error("[PUT /api/clubs/[id]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
