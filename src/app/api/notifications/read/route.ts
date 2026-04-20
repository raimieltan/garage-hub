import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Provide ids (string[]) or all: true" },
        { status: 400 }
      );
    }

    if ((body as Record<string, unknown>).all === true) {
      await prisma.notification.updateMany({
        where: { userId: authUser.id, read: false },
        data: { read: true },
      });
      return Response.json({ success: true });
    }

    const { ids } = body as Record<string, unknown>;

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json(
        { error: "Provide ids (string[]) or all: true" },
        { status: 400 }
      );
    }

    // Only allow marking notifications owned by the auth user
    await prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId: authUser.id,
      },
      data: { read: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/notifications/read]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
