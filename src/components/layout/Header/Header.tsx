"use client";

import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { NotificationPopover } from "./NotificationPopover";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:pl-6">
        {/* Spacer for mobile menu button on mobile */}
        <div className="w-10 lg:hidden" />

        {/* Breadcrumbs */}
        <div className="flex-1 min-w-0">
          <Breadcrumbs />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <NotificationPopover />

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
