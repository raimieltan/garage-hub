import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      where: {
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
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

    return Response.json({ events });
  } catch (error) {
    console.error("[GET /api/events]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const { title, description, location, date, coverImageUrl } = body;

    if (!title || !description || !location || !date) {
      return Response.json(
        { error: "title, description, location, and date are required" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return Response.json({ error: "Invalid date format" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        organizerId: authUser.id,
        title,
        description,
        location,
        date: parsedDate,
        coverImageUrl: coverImageUrl ?? null,
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

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/events]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
