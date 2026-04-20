import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireAuth, AuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const cars = await prisma.car.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ cars });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[GET /api/cars]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const { year, make, model, trim, description, horsepower, photos, isFeatured } = body;

    if (!year || !make || !model) {
      return Response.json(
        { error: "year, make, and model are required" },
        { status: 400 }
      );
    }

    const car = await prisma.car.create({
      data: {
        userId: authUser.id,
        year: Number(year),
        make,
        model,
        trim: trim ?? null,
        description: description ?? null,
        horsepower: horsepower ? Number(horsepower) : null,
        photos: photos ?? [],
        isFeatured: isFeatured ?? false,
      },
    });

    return Response.json({ car }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/cars]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
