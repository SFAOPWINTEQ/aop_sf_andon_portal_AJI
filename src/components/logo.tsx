"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative w-48 h-16" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative w-48">
        <Image
          src={isDark ? "/logo-dark.png" : "/logo.png"}
          alt="Logo"
          width={192}
          height={64}
          className="w-full h-auto object-contain"
          priority
        />
      </div>
    </div>
  );
}
