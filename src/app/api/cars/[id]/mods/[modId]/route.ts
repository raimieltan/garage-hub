import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { ModCategory } from "@/generated/prisma";

const VALID_CATEGORIES = new Set<string>(Object.values(ModCategory));

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; modId: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id, modId } = await params;

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      return Response.json({ error: "Car not found" }, { status: 404 });
    }

    if (car.userId !== authUser.id) {
      return Response.json({ error: "Forbidden: you do not own this car" }, { status: 403 });
    }

    const mod = await prisma.carMod.findUnique({ where: { id: modId } });
    if (!mod || mod.carId !== id) {
      return Response.json({ error: "Mod not found" }, { status: 404 });
    }

    const body = await request.json();
    const { category, partName, brand, price, installDate, notes } = body;

    if (category !== undefined && !VALID_CATEGORIES.has(category)) {
      return Response.json(
        { error: `Invalid category. Must be one of: ${[...VALID_CATEGORIES].join(", ")}` },
        { status: 400 }
      );
    }

    if (partName !== undefined && (typeof partName !== "string" || String(partName).trim() === "")) {
      return Response.json({ error: "partName must be a non-empty string" }, { status: 400 });
    }

    if (price !== undefined && price !== null && (typeof price !== "number" || price < 0)) {
      return Response.json({ error: "price must be a non-negative number" }, { status: 400 });
    }

    const updated = await prisma.carMod.update({
      where: { id: modId },
      data: {
        ...(category !== undefined && { category: category as ModCategory }),
        ...(partName !== undefined && { partName: String(partName).trim() }),
        ...(brand !== undefined && { brand: brand ? String(brand).trim() : null }),
        ...(price !== undefined && { price: price !== null ? Number(price) : null }),
        ...(installDate !== undefined && {
          installDate: installDate ? new Date(installDate) : null,
        }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
      },
    });

    return Response.json({ mod: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[PUT /api/cars/[id]/mods/[modId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; modId: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id, modId } = await params;

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      return Response.json({ error: "Car not found" }, { status: 404 });
    }

    if (car.userId !== authUser.id) {
      return Response.json({ error: "Forbidden: you do not own this car" }, { status: 403 });
    }

    const mod = await prisma.carMod.findUnique({ where: { id: modId } });
    if (!mod || mod.carId !== id) {
      return Response.json({ error: "Mod not found" }, { status: 404 });
    }

    await prisma.carMod.delete({ where: { id: modId } });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[DELETE /api/cars/[id]/mods/[modId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
