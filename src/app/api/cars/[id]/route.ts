import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const car = await prisma.car.findUnique({
      where: { id },
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

    if (!car) {
      return Response.json({ error: "Car not found" }, { status: 404 });
    }

    return Response.json({ car });
  } catch (error) {
    console.error("[GET /api/cars/[id]]", error);
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

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      return Response.json({ error: "Car not found" }, { status: 404 });
    }

    if (car.userId !== authUser.id) {
      return Response.json({ error: "Forbidden: you do not own this car" }, { status: 403 });
    }

    const body = await request.json();
    const { year, make, model, trim, description, horsepower, photos, isFeatured } = body;

    const updated = await prisma.car.update({
      where: { id },
      data: {
        ...(year !== undefined && { year: Number(year) }),
        ...(make !== undefined && { make }),
        ...(model !== undefined && { model }),
        ...(trim !== undefined && { trim }),
        ...(description !== undefined && { description }),
        ...(horsepower !== undefined && { horsepower: horsepower ? Number(horsepower) : null }),
        ...(photos !== undefined && { photos }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
    });

    return Response.json({ car: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[PUT /api/cars/[id]]", error);
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

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      return Response.json({ error: "Car not found" }, { status: 404 });
    }

    if (car.userId !== authUser.id) {
      return Response.json({ error: "Forbidden: you do not own this car" }, { status: 403 });
    }

    await prisma.car.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[DELETE /api/cars/[id]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
