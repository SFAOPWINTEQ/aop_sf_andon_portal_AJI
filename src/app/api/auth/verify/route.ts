import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/jwt";

/**
 * GET /api/auth/verify
 * Verify JWT token and return user information
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "user": {
 *     "userId": "...",
 *     "npk": "user123",
 *     "role": "USER",
 *     "isActive": true
 *   }
 * }
 */
export async function GET(request: NextRequest) {
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

  return NextResponse.json(
    {
      success: true,
      user: auth.payload,
    },
    { status: 200 },
  );
}
