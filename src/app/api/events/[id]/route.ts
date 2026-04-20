import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        rsvps: {
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
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { rsvps: true },
        },
      },
    });

    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json({ event });
  } catch (error) {
    console.error("[GET /api/events/[id]]", error);
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

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== authUser.id) {
      return Response.json({ error: "Forbidden: you are not the organizer" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, location, date, coverImageUrl } = body;

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return Response.json({ error: "Invalid date format" }, { status: 400 });
      }
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { rsvps: true },
        },
      },
    });

    return Response.json({ event: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[PUT /api/events/[id]]", error);
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

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== authUser.id) {
      return Response.json({ error: "Forbidden: you are not the organizer" }, { status: 403 });
    }

    await prisma.event.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[DELETE /api/events/[id]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
