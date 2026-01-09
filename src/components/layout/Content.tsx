"use client";

import { useSidebar } from "@/context/sidebar-context";
import { cn } from "@/lib/utils";

export function Content({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={cn(
        "transition-all duration-100",
        isCollapsed ? "lg:pl-16" : "lg:pl-64",
      )}
    >
      {children}
    </div>
  );
}
