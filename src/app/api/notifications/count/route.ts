import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const unread = await prisma.notification.count({
      where: { userId: authUser.id, read: false },
    });

    return Response.json({ unread });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[GET /api/notifications/count]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
