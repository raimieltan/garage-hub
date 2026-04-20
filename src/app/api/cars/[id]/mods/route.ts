import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { ModCategory } from "@/generated/prisma";

const VALID_CATEGORIES = new Set<string>(Object.values(ModCategory));

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

    const mods = await prisma.carMod.findMany({
      where: { carId: id },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });

    // Group by category
    const grouped: Record<string, typeof mods> = {};
    for (const mod of mods) {
      if (!grouped[mod.category]) {
        grouped[mod.category] = [];
      }
      grouped[mod.category].push(mod);
    }

    // Sum all mod prices
    const totalCost = mods.reduce((sum, mod) => sum + (mod.price ?? 0), 0);

    return Response.json({ car, modsByCategory: grouped, totalCost });
  } catch (error) {
    console.error("[GET /api/cars/[id]/mods]", error);
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
    const { category, partName, brand, price, installDate, notes } = body;

    if (!category || !VALID_CATEGORIES.has(category)) {
      return Response.json(
        { error: `Invalid category. Must be one of: ${[...VALID_CATEGORIES].join(", ")}` },
        { status: 400 }
      );
    }

    if (!partName || typeof partName !== "string" || partName.trim() === "") {
      return Response.json({ error: "partName is required" }, { status: 400 });
    }

    if (price !== undefined && price !== null && (typeof price !== "number" || price < 0)) {
      return Response.json({ error: "price must be a non-negative number" }, { status: 400 });
    }

    const mod = await prisma.carMod.create({
      data: {
        carId: id,
        category: category as ModCategory,
        partName: partName.trim(),
        ...(brand !== undefined && { brand: brand ? String(brand).trim() : null }),
        ...(price !== undefined && { price: price !== null ? Number(price) : null }),
        ...(installDate !== undefined && {
          installDate: installDate ? new Date(installDate) : null,
        }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
      },
    });

    return Response.json({ mod }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/cars/[id]/mods]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
