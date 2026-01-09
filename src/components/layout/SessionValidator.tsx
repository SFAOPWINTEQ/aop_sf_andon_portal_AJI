"use client";

import { useSessionValidator } from "@/hooks/useSessionValidator";

export function SessionValidator() {
  // Check session every 60 seconds (1 minute)
  useSessionValidator(60000);

  return null;
}
