import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, displayName } = body;

    if (!email || !username || !password || !displayName) {
      return Response.json(
        { error: "email, username, password, and displayName are required" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      const field = existing.email === email ? "email" : "username";
      return Response.json(
        { error: `A user with that ${field} already exists` },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const token = signToken(user.id);

    return Response.json({ token, user }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
