"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Logo } from "@/components/logo";
import {
  LayoutDashboard,
  Users,
  User2Icon,
  UserCog2Icon,
  Settings,
  Menu,
  ChevronRight,
  PanelLeftClose,
  Calendar,
  TrendingUp,
  ClipboardList,
  Timer,
  XCircle,
  Gauge,
  Database,
  Factory,
  Cog,
  Calendar1,
  Package,
  AlertTriangle,
  Clock,
  ClockAlert,
  SettingsIcon,
  Bell,
  Activity,
  Building2,
  Sliders,
  ClipboardClock,
} from "lucide-react";
import { useSidebar } from "@/context/sidebar-context";
import { useCurrentUser } from "@/hooks/useAuth";

interface SubNavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  subItems?: SubNavItem[];
  requiresAdmin?: boolean; // New field to mark admin-only items
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    subItems: [
      {
        title: "General",
        href: "/dashboard/general",
        icon: Activity,
      },
      {
        title: "Status Line",
        href: "/dashboard/status-line",
        icon: Factory,
      },
    ],
  },
  {
    title: "Schedule",
    href: "/schedule",
    icon: Calendar,
  },
  {
    title: "Reports",
    icon: TrendingUp,
    subItems: [
      {
        title: "Achievements",
        href: "/reports/achievements",
        icon: ClipboardList,
      },
      {
        title: "Loss Time",
        href: "/reports/loss-time",
        icon: Timer,
      },
      {
        title: "Pareto Loss Time",
        href: "/reports/pareto-loss-time",
        icon: TrendingUp,
      },
      {
        title: "Rejections",
        href: "/reports/rejections",
        icon: XCircle,
      },
      {
        title: "Pareto Reject",
        href: "/reports/pareto-reject",
        icon: AlertTriangle,
      },
      {
        title: "OEE",
        href: "/reports/oee",
        icon: Gauge,
      },
      {
        title: "Tracking Report",
        href: "/reports/tracking-report",
        icon: ClipboardClock,
      },
    ],
  },
  {
    title: "Master Data",
    icon: Database,
    requiresAdmin: true, // Only admin can see this
    subItems: [
      {
        title: "Plants",
        href: "/master-data/plants",
        icon: Building2,
      },
      {
        title: "Lines",
        href: "/master-data/lines",
        icon: Factory,
      },
      {
        title: "Machine Types",
        href: "/master-data/machine-types",
        icon: SettingsIcon,
      },
      {
        title: "Parameters",
        href: "/master-data/parameters",
        icon: Sliders,
      },
      {
        title: "Machine Type Parameters",
        href: "/master-data/machine-type-parameters",
        icon: Settings,
      },
      {
        title: "Machines",
        href: "/master-data/machines",
        icon: Cog,
      },
      {
        title: "Shifts",
        href: "/master-data/shifts",
        icon: Clock,
      },
      {
        title: "Parts",
        href: "/master-data/parts",
        icon: Package,
      },
      {
        title: "Child Parts",
        href: "/master-data/child-parts",
        icon: Package,
      },
      {
        title: "Rejects",
        href: "/master-data/reject-criteria",
        icon: AlertTriangle,
      },
      {
        title: "PDT",
        href: "/master-data/pdt-categories",
        icon: ClockAlert,
      },
      {
        title: "UPDT",
        href: "/master-data/updt-categories",
        icon: Calendar1,
      },
    ],
  },
  {
    title: "Users",
    icon: User2Icon,
    requiresAdmin: true, // Only admin can see this
    subItems: [
      {
        title: "Users",
        href: "/users",
        icon: Users,
      },
      {
        title: "Manage User Line",
        href: "/user-per-lines",
        icon: UserCog2Icon,
      }
    ]
  },
  {
    title: "Settings",
    icon: Settings,
    subItems: [
      {
        title: "General",
        href: "/settings",
        icon: SettingsIcon,
      },
      {
        title: "Notifications",
        href: "/settings/notifications",
        icon: Bell,
      },
    ],
  },
];

function SidebarContent({
  onNavigate,
  isCollapsed,
}: {
  onNavigate?: () => void;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  const isItemActive = (item: NavItem) => {
    if (item.href && pathname === item.href) return true;
    if (item.subItems) {
      return item.subItems.some((sub) => pathname === sub.href);
    }
    return false;
  };

  // Filter menu items based on user role
  const filteredNavItems = navItems.filter((item) => {
    // If item requires admin and user is not admin, hide it
    if (item.requiresAdmin && currentUser?.role !== "ADMIN") {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b transition-all relative",
          isCollapsed ? "justify-center px-2" : "pl-4 sm:pl-6 pr-12",
        )}
      >
        {!isCollapsed && (
          <Link
            href="/dashboard/general"
            className="flex items-center gap-2 flex-1 justify-center mr-2"
            onClick={onNavigate}
          >
            <Logo className="h-8 w-auto" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea
        className={cn(
          "flex-1 py-4 transition-all",
          isCollapsed ? "px-2" : "px-2 sm:px-3",
        )}
      >
        <nav className="flex flex-col gap-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openItems.includes(item.title);
            const isActive = isItemActive(item);

            if (hasSubItems) {
              // When collapsed, show popover with submenu
              if (isCollapsed) {
                return (
                  <Popover key={item.title}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="w-56 p-2"
                      sideOffset={8}
                    >
                      <div className="space-y-1">
                        <div className="px-2 py-1.5 text-sm font-semibold">
                          {item.title}
                        </div>
                        {item.subItems?.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          const SubIcon = subItem.icon;

                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={onNavigate}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
                                isSubActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                              )}
                            >
                              {SubIcon && <SubIcon className="h-4 w-4" />}
                              <span>{subItem.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              // When expanded, show collapsible submenu
              return (
                <Collapsible
                  key={item.title}
                  open={isOpen}
                  onOpenChange={() => toggleItem(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-90",
                        )}
                      />
                      {item.badge && (
                        <span className="ml-auto text-xs font-medium">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-1 space-y-1">
                    {item.subItems?.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      const SubIcon = subItem.icon;

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-3 rounded-lg pl-10 pr-3 py-2 text-sm transition-colors",
                            isSubActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          {SubIcon && <SubIcon className="h-3.5 w-3.5" />}
                          <span>{subItem.title}</span>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            // Regular menu item without subitems
            if (!item.href) return null;

            return (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                        isCollapsed ? "justify-center" : "gap-3",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                      {item.badge && !isCollapsed && (
                        <span className="ml-auto text-xs font-medium">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            <p>Andon Portal v1.0</p>
            <p className="mt-1">© 2025 All rights reserved</p>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <>
      {/* Desktop Sidebar - Fixed */}
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col border-r bg-card transition-all duration-100 relative",
          isCollapsed ? "lg:w-16" : "lg:w-64",
        )}
      >
        <SidebarContent isCollapsed={isCollapsed} />

        {/* Collapse Toggle Button - Desktop Only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute top-4 hidden lg:flex h-7 w-7 rounded-md border bg-background shadow-sm hover:bg-accent z-50",
            isCollapsed ? "left-1/2 -translate-x-1/2" : "right-2",
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </aside>

      {/* Mobile Sidebar - Sheet/Drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed left-4 top-3.5 z-50"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 sm:w-80 p-0">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <SidebarContent
            onNavigate={() => {
              // Close the sheet on navigation
              document
                .querySelector<HTMLButtonElement>('[data-state="open"]')
                ?.click();
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
