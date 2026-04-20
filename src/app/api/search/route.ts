import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["users", "cars", "posts"] as const;
type SearchType = (typeof VALID_TYPES)[number];

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const q = searchParams.get("q");
    if (!q || q.trim().length === 0) {
      return Response.json({ error: "q is required" }, { status: 400 });
    }

    const query = q.trim();
    const typeParam = searchParams.get("type");
    const cursor = searchParams.get("cursor") ?? undefined;
    const yearParam = searchParams.get("year");

    if (typeParam && !VALID_TYPES.includes(typeParam as SearchType)) {
      return Response.json(
        { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const type = typeParam as SearchType | null;

    if (type === "users") {
      const users = await searchUsers(query, cursor);
      return Response.json(buildCursorResponse("users", users, PAGE_SIZE));
    }

    if (type === "cars") {
      const year = yearParam ? Number(yearParam) : undefined;
      const cars = await searchCars(query, cursor, year);
      return Response.json(buildCursorResponse("cars", cars, PAGE_SIZE));
    }

    if (type === "posts") {
      const posts = await searchPosts(query, cursor);
      return Response.json(buildCursorResponse("posts", posts, PAGE_SIZE));
    }

    // Search all types — cursor-based pagination is per-type when combined
    const [users, cars, posts] = await Promise.all([
      searchUsers(query, undefined),
      searchCars(query, undefined, undefined),
      searchPosts(query, undefined),
    ]);

    return Response.json({
      users: users.slice(0, PAGE_SIZE),
      cars: cars.slice(0, PAGE_SIZE),
      posts: posts.slice(0, PAGE_SIZE),
    });
  } catch (error) {
    console.error("[GET /api/search]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildCursorResponse<T extends { id: string }>(
  key: string,
  items: T[],
  pageSize: number
) {
  const hasMore = items.length > pageSize;
  const page = hasMore ? items.slice(0, pageSize) : items;
  const nextCursor = hasMore ? page[page.length - 1].id : null;
  return { [key]: page, nextCursor };
}

async function searchUsers(query: string, cursor?: string) {
  return prisma.user.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    where: {
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      _count: {
        select: { followers: true },
      },
    },
  });
}

async function searchCars(query: string, cursor?: string, year?: number) {
  return prisma.car.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    where: {
      AND: [
        {
          OR: [
            { make: { contains: query, mode: "insensitive" } },
            { model: { contains: query, mode: "insensitive" } },
          ],
        },
        ...(year ? [{ year }] : []),
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
}

async function searchPosts(query: string, cursor?: string) {
  return prisma.post.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    where: {
      content: { contains: query, mode: "insensitive" },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      car: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          trim: true,
          photos: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });
}
