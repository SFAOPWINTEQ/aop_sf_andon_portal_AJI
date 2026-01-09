"use server";

import { auth } from "@/auth";
import { getUserJwt } from "./authRepository";

/**
 * Check if the current user's session is still valid
 * Returns true if valid, false if user should be logged out
 */
export async function validateUserSession(): Promise<boolean> {
  const session = await auth();

  if (!session?.user?.id) {
    return false;
  }

  // Check current user status in database
  const user = await getUserJwt(session.user.id);

  // If user not found or inactive, session is invalid
  if (!user || !user.isActive) {
    return false;
  }

  return true;
}
