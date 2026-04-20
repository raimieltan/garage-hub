import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const cars = await prisma.car.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ cars });
  } catch (error) {
    console.error("[GET /api/users/[id]/cars]", error);
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

    if (authUser.id !== id) {
      return Response.json(
        { error: "Forbidden: you can only add cars to your own profile" },
        { status: 403 }
      );
    }

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
        userId: id,
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
    console.error("[POST /api/users/[id]/cars]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
