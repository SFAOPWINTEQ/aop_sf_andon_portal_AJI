import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

// Secret for JWT - should match the one used in login
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "your-secret-key",
);

export interface JWTPayload {
  userId: string;
  npk: string;
  role: string;
  isActive: boolean;
}

/**
 * Verify JWT token from Authorization header
 * @param request - Next.js request object
 * @returns Decoded JWT payload or null if invalid
 */
export async function verifyToken(
  request: NextRequest,
): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      userId: payload.userId as string,
      npk: payload.npk as string,
      role: payload.role as string,
      isActive: payload.isActive as boolean,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Middleware to require authentication for API routes
 * Returns decoded payload or sends 401 response
 */
export async function requireAuth(request: NextRequest) {
  const payload = await verifyToken(request);

  if (!payload) {
    return {
      error: "Unauthorized",
      status: 401,
      payload: null,
    };
  }

  if (!payload.isActive) {
    return {
      error: "User is inactive",
      status: 403,
      payload: null,
    };
  }

  return {
    error: null,
    status: 200,
    payload,
  };
}

/**
 * Middleware to require specific roles for API routes
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[],
) {
  const auth = await requireAuth(request);

  if (auth.error || !auth.payload) {
    return auth;
  }

  if (!allowedRoles.includes(auth.payload.role)) {
    return {
      error: "Forbidden: Insufficient permissions",
      status: 403,
      payload: null,
    };
  }

  return {
    error: null,
    status: 200,
    payload: auth.payload,
  };
}
