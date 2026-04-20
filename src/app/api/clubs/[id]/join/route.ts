import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

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

    const existing = await prisma.clubMembership.findUnique({
      where: { clubId_userId: { clubId: id, userId: authUser.id } },
    });

    if (existing) {
      // Already a member — leave the club (toggle)
      // Prevent creator from leaving their own club
      if (club.creatorId === authUser.id) {
        return Response.json(
          { error: "Club creator cannot leave the club" },
          { status: 400 }
        );
      }

      await prisma.clubMembership.delete({
        where: { clubId_userId: { clubId: id, userId: authUser.id } },
      });

      return Response.json({ joined: false, message: "Left the club" });
    }

    // Not a member — join the club
    await prisma.clubMembership.create({
      data: {
        clubId: id,
        userId: authUser.id,
        role: "member",
      },
    });

    return Response.json({ joined: true, message: "Joined the club" }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/clubs/[id]/join]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
