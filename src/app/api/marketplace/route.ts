import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getAuthUser, AuthError } from "@/lib/auth";
import { ListingCondition, ListingStatus } from "@/generated/prisma";

const VALID_CONDITIONS = new Set<string>(Object.values(ListingCondition));
// REMOVED is not a publicly browsable status — excluded from the allowed set
const PUBLIC_STATUSES = new Set<string>([ListingStatus.ACTIVE, ListingStatus.SOLD]);

const SELLER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const condition = searchParams.get("condition");
    const search = searchParams.get("search");
    const cursor = searchParams.get("cursor");
    const limitParam = searchParams.get("limit");
    const statusParam = searchParams.get("status");

    const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 100);

    // Requesting REMOVED listings requires authentication and is scoped to the
    // caller's own listings only — other statuses are publicly browsable.
    let statusFilter: ListingStatus;
    let sellerIdFilter: string | undefined;

    if (statusParam === ListingStatus.REMOVED) {
      const authUser = await getAuthUser(request);
      if (!authUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      statusFilter = ListingStatus.REMOVED;
      sellerIdFilter = authUser.id;
    } else {
      // Default to ACTIVE; only allow other public statuses
      statusFilter =
        statusParam && PUBLIC_STATUSES.has(statusParam)
          ? (statusParam as ListingStatus)
          : ListingStatus.ACTIVE;
    }

    const where: Record<string, unknown> = {
      status: statusFilter,
      ...(sellerIdFilter && { sellerId: sellerIdFilter }),
      ...(category && { category }),
      ...(condition && VALID_CONDITIONS.has(condition) && { condition: condition as ListingCondition }),
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
              ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const listings = await prisma.marketplaceListing.findMany({
      where,
      include: { seller: { select: SELLER_SELECT } },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (listings.length > limit) {
      const nextItem = listings.pop();
      nextCursor = nextItem!.id;
    }

    return Response.json({ listings, nextCursor });
  } catch (error) {
    console.error("[GET /api/marketplace]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const body = await request.json();
    const { title, description, price, condition, category, photos, location, carMake, carModel, carYear } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return Response.json({ error: "title is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim() === "") {
      return Response.json({ error: "description is required" }, { status: 400 });
    }
    if (price === undefined || price === null || typeof price !== "number" || price <= 0) {
      return Response.json({ error: "price must be a positive number" }, { status: 400 });
    }
    if (!condition || !VALID_CONDITIONS.has(condition)) {
      return Response.json(
        { error: `Invalid condition. Must be one of: ${[...VALID_CONDITIONS].join(", ")}` },
        { status: 400 }
      );
    }
    if (!category || typeof category !== "string" || category.trim() === "") {
      return Response.json({ error: "category is required" }, { status: 400 });
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        sellerId: authUser.id,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        condition: condition as ListingCondition,
        category: category.trim(),
        photos: Array.isArray(photos) ? photos : [],
        ...(location !== undefined && { location: location ? String(location).trim() : null }),
        ...(carMake !== undefined && { carMake: carMake ? String(carMake).trim() : null }),
        ...(carModel !== undefined && { carModel: carModel ? String(carModel).trim() : null }),
        ...(carYear !== undefined && { carYear: carYear ? Number(carYear) : null }),
      },
      include: { seller: { select: SELLER_SELECT } },
    });

    return Response.json({ listing }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/marketplace]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
