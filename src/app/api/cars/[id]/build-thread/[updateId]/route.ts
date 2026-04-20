import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  try {
    const { id, updateId } = await params;

    const update = await prisma.buildUpdate.findUnique({
      where: { id: updateId },
    });

    if (!update || update.carId !== id) {
      return Response.json({ error: "Build update not found" }, { status: 404 });
    }

    return Response.json({ update });
  } catch (error) {
    console.error("[GET /api/cars/[id]/build-thread/[updateId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id, updateId } = await params;

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      return Response.json({ error: "Car not found" }, { status: 404 });
    }

    if (car.userId !== authUser.id) {
      return Response.json({ error: "Forbidden: you do not own this car" }, { status: 403 });
    }

    const update = await prisma.buildUpdate.findUnique({ where: { id: updateId } });
    if (!update || update.carId !== id) {
      return Response.json({ error: "Build update not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, photos } = body;

    if (title !== undefined && (typeof title !== "string" || String(title).trim() === "")) {
      return Response.json({ error: "title must be a non-empty string" }, { status: 400 });
    }
    if (description !== undefined && (typeof description !== "string" || String(description).trim() === "")) {
      return Response.json({ error: "description must be a non-empty string" }, { status: 400 });
    }

    const updated = await prisma.buildUpdate.update({
      where: { id: updateId },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(photos !== undefined && { photos }),
      },
    });

    return Response.json({ update: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[PUT /api/cars/[id]/build-thread/[updateId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id, updateId } = await params;

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      return Response.json({ error: "Car not found" }, { status: 404 });
    }

    if (car.userId !== authUser.id) {
      return Response.json({ error: "Forbidden: you do not own this car" }, { status: 403 });
    }

    const update = await prisma.buildUpdate.findUnique({ where: { id: updateId } });
    if (!update || update.carId !== id) {
      return Response.json({ error: "Build update not found" }, { status: 404 });
    }

    await prisma.buildUpdate.delete({ where: { id: updateId } });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[DELETE /api/cars/[id]/build-thread/[updateId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
