import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        cars: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error("[GET /api/users/[id]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await params;

    if (authUser.id !== id) {
      return Response.json({ error: "Forbidden: you can only update your own profile" }, { status: 403 });
    }

    const body = await request.json();
    const { displayName, bio, avatarUrl } = body;

    if (displayName !== undefined && (typeof displayName !== "string" || displayName.trim() === "")) {
      return Response.json({ error: "displayName must be a non-empty string" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName: displayName.trim() }),
        ...(bio !== undefined && { bio: bio ? String(bio) : null }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl ? String(avatarUrl) : null }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ user: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[PATCH /api/users/[id]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
