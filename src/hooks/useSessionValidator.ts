"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { validateUserSession } from "@/server/sessionActions";
import { signOut } from "next-auth/react";

/**
 * Hook to periodically validate user session
 * Automatically logs out user if they become inactive or deleted
 */
export function useSessionValidator(intervalMs: number = 60000) {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const isValid = await validateUserSession();

        if (!isValid) {
          // Session is invalid, log out user
          await signOut({ redirect: false });
          router.push("/login?error=SessionExpired");
        }
      } catch (error) {
        console.error("Session validation error:", error);
        // On error, also log out for security
        await signOut({ redirect: false });
        router.push("/login?error=SessionError");
      }
    };

    // Check immediately on mount
    checkSession();

    // Then check periodically
    const interval = setInterval(checkSession, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, router]);
}
