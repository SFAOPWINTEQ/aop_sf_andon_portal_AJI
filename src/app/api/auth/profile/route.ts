import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/jwt";
import { db } from "@/lib/db";

/**
 * GET /api/auth/profile
 * Get current user profile information
 * Requires authentication
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "user": {
 *     "id": "...",
 *     "npk": "user123",
 *     "name": "John Doe",
 *     "role": "USER",
 *     "isActive": true,
 *     "createdAt": "2024-11-15T10:00:00.000Z",
 *     "lastLoginAt": "2024-11-15T14:30:00.000Z"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const auth = await requireAuth(request);

  if (auth.error || !auth.payload) {
    return NextResponse.json(
      {
        success: false,
        message: auth.error,
      },
      { status: auth.status },
    );
  }

  try {
    // Fetch full user details from database
    const user = await db.user.findUnique({
      where: { id: auth.payload.userId },
      select: {
        id: true,
        npk: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
