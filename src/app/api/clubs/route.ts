import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");

    const clubs = await prisma.carClub.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = clubs.map(({ _count, ...club }) => ({
      ...club,
      memberCount: _count.memberships,
    }));

    return Response.json({ clubs: result });
  } catch (error) {
    console.error("[GET /api/clubs]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const body = await request.json();
    const { name, description, coverImage } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim() === "") {
      return Response.json({ error: "description is required" }, { status: 400 });
    }

    // Create the club and add the creator as a member with role "creator"
    const club = await prisma.carClub.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        ...(coverImage !== undefined && { coverImage: coverImage ? String(coverImage) : null }),
        creatorId: authUser.id,
        memberships: {
          create: {
            userId: authUser.id,
            role: "creator",
          },
        },
      },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { memberships: true } },
      },
    });

    const { _count, ...clubData } = club;

    return Response.json({ club: { ...clubData, memberCount: _count.memberships } }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    // Unique constraint violation on name
    if ((error as { code?: string }).code === "P2002") {
      return Response.json({ error: "A club with that name already exists" }, { status: 409 });
    }
    console.error("[POST /api/clubs]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
