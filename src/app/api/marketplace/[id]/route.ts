import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getAuthUser, AuthError } from "@/lib/auth";
import { ListingCondition, ListingStatus } from "@/generated/prisma";

const VALID_CONDITIONS = new Set<string>(Object.values(ListingCondition));
const VALID_STATUSES = new Set<string>(Object.values(ListingStatus));

const SELLER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: { seller: { select: SELLER_SELECT } },
    });

    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    // REMOVED listings are only visible to the seller
    if (listing.status === ListingStatus.REMOVED) {
      const authUser = await getAuthUser(request);
      if (!authUser || authUser.id !== listing.sellerId) {
        return Response.json({ error: "Listing not found" }, { status: 404 });
      }
    }

    // Fetch seller's other active listings (excluding this one), limit 4
    const otherListings = await prisma.marketplaceListing.findMany({
      where: {
        sellerId: listing.sellerId,
        status: ListingStatus.ACTIVE,
        id: { not: id },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        price: true,
        condition: true,
        category: true,
        photos: true,
        createdAt: true,
      },
    });

    return Response.json({ listing, sellerOtherListings: otherListings });
  } catch (error) {
    console.error("[GET /api/marketplace/[id]]", error);
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

    const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== authUser.id) {
      return Response.json({ error: "Forbidden: you are not the seller" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, price, condition, category, status, photos, location, carMake, carModel, carYear } =
      body;

    if (title !== undefined && (typeof title !== "string" || String(title).trim() === "")) {
      return Response.json({ error: "title must be a non-empty string" }, { status: 400 });
    }
    if (description !== undefined && (typeof description !== "string" || String(description).trim() === "")) {
      return Response.json({ error: "description must be a non-empty string" }, { status: 400 });
    }
    if (category !== undefined && (typeof category !== "string" || String(category).trim() === "")) {
      return Response.json({ error: "category must be a non-empty string" }, { status: 400 });
    }

    if (condition !== undefined && !VALID_CONDITIONS.has(condition)) {
      return Response.json(
        { error: `Invalid condition. Must be one of: ${[...VALID_CONDITIONS].join(", ")}` },
        { status: 400 }
      );
    }

    if (status !== undefined && !VALID_STATUSES.has(status)) {
      return Response.json(
        { error: `Invalid status. Must be one of: ${[...VALID_STATUSES].join(", ")}` },
        { status: 400 }
      );
    }

    if (price !== undefined && (typeof price !== "number" || price <= 0)) {
      return Response.json({ error: "price must be a positive number" }, { status: 400 });
    }

    const updated = await prisma.marketplaceListing.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(price !== undefined && { price: Number(price) }),
        ...(condition !== undefined && { condition: condition as ListingCondition }),
        ...(category !== undefined && { category: String(category).trim() }),
        ...(status !== undefined && { status: status as ListingStatus }),
        ...(photos !== undefined && { photos }),
        ...(location !== undefined && { location: location ? String(location).trim() : null }),
        ...(carMake !== undefined && { carMake: carMake ? String(carMake).trim() : null }),
        ...(carModel !== undefined && { carModel: carModel ? String(carModel).trim() : null }),
        ...(carYear !== undefined && { carYear: carYear ? Number(carYear) : null }),
      },
      include: { seller: { select: SELLER_SELECT } },
    });

    return Response.json({ listing: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[PUT /api/marketplace/[id]]", error);
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

    const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== authUser.id) {
      return Response.json({ error: "Forbidden: you are not the seller" }, { status: 403 });
    }

    // Soft delete — set status to REMOVED
    const removed = await prisma.marketplaceListing.update({
      where: { id },
      data: { status: ListingStatus.REMOVED },
    });

    return Response.json({ listing: removed });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[DELETE /api/marketplace/[id]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
