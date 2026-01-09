"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Settings, LogOut, Shield } from "lucide-react";
import { logout } from "@/server/authService";
import { useTransition } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useAuth";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadgeVariant(
  role: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (role.toUpperCase()) {
    case "ADMIN":
      return "destructive";
    case "SUPERVISOR":
      return "default";
    default:
      return "secondary";
  }
}

export function UserMenu() {
  const [isPending, startTransition] = useTransition();
  const user = useCurrentUser();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await logout();
        toast.success("Logged out successfully");
      } catch (error) {
        toast.error("Failed to logout");
        console.error("Logout error:", error);
      }
    });
  };

  const displayName = user?.name || "User";
  const displayNpk = user?.npk || "Unknown";
  const displayRole = user?.role || "USER";
  const initials = getInitials(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/avatar.jpg" alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <Badge
                variant={getRoleBadgeVariant(displayRole)}
                className="text-xs"
              >
                {displayRole}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>NPK: {displayNpk}</span>
            </div>
            {user?.isActive !== undefined && !user.isActive && (
              <Badge variant="outline" className="text-xs w-fit">
                Inactive
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleLogout}
          disabled={isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isPending ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
