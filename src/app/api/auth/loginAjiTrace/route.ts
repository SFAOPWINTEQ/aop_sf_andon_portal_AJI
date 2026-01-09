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

    // Validate input
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

    const { npk, password, uid } = validation.data;

    

    if (uid) {
      let user;

      // Login via UID
      user = await db.userPerLine.findFirst({
        where: { uid, deletedAt: null, isActive: true }, // pastikan field UID ada di table user
        select: { 
          id: true, 
          user : {
            select: {
              id: true,
              name: true,
              npk: true,
              role: true,
              isActive: true
            }
          } 
        },
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid NPK or password",
          },
          { status: 401 },
        );
      }
      
      // Generate JWT token
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

      // Update last login timestamp
      await authRepository.updateLastLogin(user.user.id);

      return NextResponse.json(
        {
          success: true,
          message: "Login successful",
          token,
          user: {
            id: user.id,
            npk: user.user.npk,
            name: user.user.name,
            role: user.user.role,
            isActive: user.user.isActive,
          },
        },
        { status: 200 },
      );
    }

    // Find user by NPK
    const Masteruser = await db.userPerLine.findFirst({
      where: { 
        user: {
          npk: npk
        },
        deletedAt: null,
        isActive: true
      },
      select: {
        user : {
          select: {
            id: true,
            npk: true,
            name: true,
            password: true,
            role: true,
            isActive: true,
          }
        }
      },
    });

    if (!Masteruser || !Masteruser.user.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid NPK or password",
        },
        { status: 401 },
      );
    }

    // Check if user is active
    if (!Masteruser.user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "User is inactive. Please contact administrator.",
        },
        { status: 403 },
      );
    }

    // Verify password
    const passwordsMatch = await bcrypt.compare(password, Masteruser.user.password);
    if (!passwordsMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid NPK or password",
        },
        { status: 401 },
      );
    }

    // Generate JWT token
    const token = await new SignJWT({
      userId: Masteruser.user.id,
      npk: Masteruser.user.npk,
      role: Masteruser.user.role,
      isActive: Masteruser.user.isActive,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    // Update last login timestamp
    await authRepository.updateLastLogin(Masteruser.user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        token,
        user: {
          id: Masteruser.user.id,
          npk: Masteruser.user.npk,
          name: Masteruser.user.name,
          role: Masteruser.user.role,
          isActive: Masteruser.user.isActive,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
