"use server";

import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import { type LoginInput, type LoginResponse, loginSchema } from "./authModel";
import { authRepository } from "@/server/authRepository";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

// ==================== Auth Utilities ====================

/**
 * Standard response type for authenticated actions
 */
export interface AuthenticatedResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Get current authenticated user session
 * @returns Session with user data or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

/**
 * Require authentication - throws error if not authenticated
 * @returns Authenticated user data
 * @throws Error if user is not authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

/**
 * Check if user has required role
 * @param allowedRoles - Array of allowed role names
 * @returns true if user has one of the allowed roles
 */
export async function hasRole(allowedRoles: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user?.role) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Require specific role - throws error if user doesn't have required role
 * @param allowedRoles - Array of allowed role names
 * @returns Authenticated user data
 * @throws Error if user doesn't have required role
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role || "")) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return user;
}

/**
 * Wrapper for server actions that require authentication
 * Automatically handles auth checking and error responses
 *
 * @example
 * export async function myAction(params: MyParams) {
 *   return withAuth(async (user) => {
 *     // Your logic here with authenticated user
 *     return { data: "result" };
 *   });
 * }
 */
export async function withAuth<T>(
  handler: (user: {
    id: string;
    name?: string | null;
    npk?: string | null;
    role?: string | null;
    isActive?: boolean | null;
  }) => Promise<AuthenticatedResponse<T>>,
): Promise<AuthenticatedResponse<T>> {
  try {
    const user = await requireAuth();
    return await handler(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    console.error("Error in withAuth:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Wrapper for server actions that require specific role
 * Automatically handles auth and role checking with error responses
 *
 * @example
 * export async function adminAction(params: MyParams) {
 *   return withRole(["ADMIN", "SUPERVISOR"], async (user) => {
 *     // Your logic here with authorized user
 *     return { data: "result" };
 *   });
 * }
 */
export async function withRole<T>(
  allowedRoles: string[],
  handler: (user: {
    id: string;
    name?: string | null;
    npk?: string | null;
    role?: string | null;
    isActive?: boolean | null;
  }) => Promise<AuthenticatedResponse<T>>,
): Promise<AuthenticatedResponse<T>> {
  try {
    const user = await requireRole(allowedRoles);
    return await handler(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return {
          success: false,
          message: "Unauthorized",
        };
      }
      if (error.message.startsWith("Forbidden")) {
        return {
          success: false,
          message:
            "Forbidden: You don't have permission to perform this action",
        };
      }
    }

    console.error("Error in withRole:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

// ==================== Auth Actions ====================

export async function login(data: LoginInput): Promise<LoginResponse> {
  // Validate input
  const validation = loginSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0].message,
    };
  }

  const { npk, password } = validation.data;

  // Find user by NPK
  const existingUser = await db.user.findUnique({
    where: { npk },
  });

  if (!existingUser || !existingUser.password) {
    return {
      success: false,
      message: "Invalid NPK or password",
    };
  }

  if (!existingUser.isActive) {
    return {
      success: false,
      message: "User is inactive. Please contact administrator.",
    };
  }

  // Verify password
  const passwordsMatch = await bcrypt.compare(password, existingUser.password);
  if (!passwordsMatch) {
    return {
      success: false,
      message: "Invalid NPK or password",
    };
  }

  try {
    // Sign in with NextAuth
    await signIn("credentials", {
      id: existingUser.id,
      npk: existingUser.npk,
      role: existingUser.role,
      isActive: existingUser.isActive,
      redirect: false,
    });

    // Update last login timestamp
    await authRepository.updateLastLogin(existingUser.id);

    return {
      success: true,
      message: "Login successful",
      user: {
        id: existingUser.id,
        role: existingUser.role,
        name: existingUser.name || "",
      },
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            message: "Invalid email or password",
          };
        default:
          return {
            success: false,
            message: "An error occurred during login",
          };
      }
    }
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
