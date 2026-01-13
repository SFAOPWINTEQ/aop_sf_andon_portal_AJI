import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { loginSchema } from "@/server/authModel";
import { authRepository } from "@/server/authRepository";

// Secret for JWT - should be in environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "your-secret-key",
);

/**
 * POST /api/auth/loginAjiTrace
 * Login endpoint for external applications
 *
 * Body:
 * {
 *   "npk": "user123",
 *   "password": "password123"
 *   "uid": "uid"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "token": "eyJhbGc...",
 *   "user": {
 *     "id": "...",
 *     "npk": "user123",
 *     "name": "John Doe",
 *     "role": "USER",
 *     "isActive": true
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // ======================
    // LOGIN VIA UID
    // ======================
    if ("uid" in data) {
      const { uid, line } = data;

      const user = await db.userPerLine.findFirst({
        where: {
          uid,
          deletedAt: null,
          isActive: true,
          lineId: line,
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              npk: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "Invalid UID or line" },
          { status: 401 },
        );
      }

      const token = await new SignJWT({
        userId: user.user.id,
        npk: user.user.npk,
        role: user.user.role,
        isActive: user.user.isActive,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      await authRepository.updateLastLogin(user.user.id);

      return NextResponse.json(
        {
          success: true,
          message: "Login successful",
          token,
          user: {
            id: user.user.id,
            npk: user.user.npk,
            name: user.user.name,
            role: user.user.role,
            isActive: user.user.isActive,
          },
        },
        { status: 200 },
      );
    }

    // ======================
    // LOGIN VIA NPK + PASSWORD
    // ======================
    const { npk, password, line } = data;

    const masterUser = await db.userPerLine.findFirst({
      where: {
        user: { npk },
        deletedAt: null,
        isActive: true,
        lineId: line,
      },
      select: {
        user: {
          select: {
            id: true,
            npk: true,
            name: true,
            password: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!masterUser || !masterUser.user.password) {
      return NextResponse.json(
        { success: false, message: "Invalid NPK or password" },
        { status: 401 },
      );
    }

    if (!masterUser.user.isActive) {
      return NextResponse.json(
        { success: false, message: "User is inactive" },
        { status: 403 },
      );
    }

    const passwordMatch = await bcrypt.compare(
      password,
      masterUser.user.password,
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid NPK or password" },
        { status: 401 },
      );
    }

    const token = await new SignJWT({
      userId: masterUser.user.id,
      npk: masterUser.user.npk,
      role: masterUser.user.role,
      isActive: masterUser.user.isActive,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    await authRepository.updateLastLogin(masterUser.user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        token,
        user: {
          id: masterUser.user.id,
          npk: masterUser.user.npk,
          name: masterUser.user.name,
          role: masterUser.user.role,
          isActive: masterUser.user.isActive,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}