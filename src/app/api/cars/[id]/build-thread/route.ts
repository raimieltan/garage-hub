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
      select: {
        id: true,
        year: true,
        make: true,
        model: true,
        userId: true,
      },
    });

    if (!car) {
      return Response.json({ error: "Car not found" }, { status: 404 });
    }

    const updates = await prisma.buildUpdate.findMany({
      where: { carId: id },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({ car, updates });
  } catch (error) {
    console.error("[GET /api/cars/[id]/build-thread]", error);
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

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      return Response.json({ error: "Car not found" }, { status: 404 });
    }

    if (car.userId !== authUser.id) {
      return Response.json({ error: "Forbidden: you do not own this car" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, photos } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return Response.json({ error: "title is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim() === "") {
      return Response.json({ error: "description is required" }, { status: 400 });
    }

    const update = await prisma.buildUpdate.create({
      data: {
        carId: id,
        title: title.trim(),
        description: description.trim(),
        photos: Array.isArray(photos) ? photos : [],
      },
    });

    return Response.json({ update }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/cars/[id]/build-thread]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
