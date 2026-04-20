import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireAuth, AuthError } from "@/lib/auth";
import { PostType } from "@/generated/prisma";

const PAGE_SIZE = 20;

const POST_TYPE_VALUES = Object.values(PostType) as string[];

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const { searchParams } = request.nextUrl;

    const cursor = searchParams.get("cursor") ?? undefined;
    const typeFilter = searchParams.get("type") ?? undefined;
    const userIdFilter = searchParams.get("userId") ?? undefined;

    if (typeFilter && !POST_TYPE_VALUES.includes(typeFilter)) {
      return Response.json({ error: `Invalid type. Must be one of: ${POST_TYPE_VALUES.join(", ")}` }, { status: 400 });
    }

    const posts = await prisma.post.findMany({
      take: PAGE_SIZE + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      where: {
        ...(typeFilter && { postType: typeFilter as PostType }),
        ...(userIdFilter && { authorId: userIdFilter }),
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
        ...(authUser && {
          likes: {
            where: { userId: authUser.id },
            select: { id: true },
          },
        }),
      },
    });

    const hasMore = posts.length > PAGE_SIZE;
    const page = hasMore ? posts.slice(0, PAGE_SIZE) : posts;
    const lastPost = hasMore ? page[page.length - 1] : null;
    const nextCursor = lastPost ? lastPost.id : null;

    type PostWithLikes = (typeof page)[number] & { likes?: { id: string }[] };
    const formattedPosts = (page as PostWithLikes[]).map((post) => {
      const { likes, ...rest } = post;
      return {
        ...rest,
        likedByMe: authUser ? (likes?.length ?? 0) > 0 : false,
      };
    });

    return Response.json({ posts: formattedPosts, nextCursor });
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const { content, photos, postType, carId, dynoHp, dynoTorque, dynoRpm } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return Response.json({ error: "content is required" }, { status: 400 });
    }

    if (postType && !POST_TYPE_VALUES.includes(postType)) {
      return Response.json(
        { error: `Invalid postType. Must be one of: ${POST_TYPE_VALUES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify car ownership if carId provided
    if (carId) {
      const car = await prisma.car.findUnique({ where: { id: carId } });
      if (!car) {
        return Response.json({ error: "Car not found" }, { status: 404 });
      }
      if (car.userId !== authUser.id) {
        return Response.json({ error: "Forbidden: you do not own this car" }, { status: 403 });
      }
    }

    const post = await prisma.post.create({
      data: {
        authorId: authUser.id,
        content: content.trim(),
        photos: photos ?? [],
        postType: (postType as PostType) ?? PostType.GENERAL,
        carId: carId ?? null,
        dynoHp: dynoHp ? Number(dynoHp) : null,
        dynoTorque: dynoTorque ? Number(dynoTorque) : null,
        dynoRpm: dynoRpm ? Number(dynoRpm) : null,
      },
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

    return Response.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/posts]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
