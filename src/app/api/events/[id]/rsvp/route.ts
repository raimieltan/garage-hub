import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { RSVPStatus } from "@/generated/prisma";

const RSVP_STATUS_VALUES = Object.values(RSVPStatus) as string[];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !RSVP_STATUS_VALUES.includes(status)) {
      return Response.json(
        { error: `status must be one of: ${RSVP_STATUS_VALUES.join(", ")}` },
        { status: 400 }
      );
    }

    const rsvp = await prisma.rSVP.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: authUser.id,
        },
      },
      update: { status: status as RSVPStatus },
      create: {
        eventId,
        userId: authUser.id,
        status: status as RSVPStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return Response.json({ rsvp });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/events/[id]/rsvp]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
