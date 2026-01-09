import { cn } from "@/lib/utils";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

// Custom breadcrumb labels for specific routes
const getBreadcrumbLabel = (
  segment: string,
  index: number,
  segments: string[],
) => {
  // Check if this is a dynamic ID segment (looks like a cuid)
  const isCuid = segment.length > 20 && /^[a-z0-9]+$/i.test(segment);

  // If it's a cuid and the previous segment is "schedule", show "Detail"
  if (isCuid && index > 0 && segments[index - 1] === "schedule") {
    return "Detail";
  }

  // Handle dashes: replace with spaces and capitalize each word
  if (segment.includes("-")) {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Default: capitalize first letter
  return segment.charAt(0).toUpperCase() + segment.slice(1);
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1 sm:gap-2 text-sm overflow-x-auto no-scrollbar">
      <Link
        href="/dashboard/general"
        className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap hidden sm:inline"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = getBreadcrumbLabel(segment, index, segments);

        // On mobile, only show the last segment
        const hiddenOnMobile = !isLast && segments.length > 1;

        return (
          <Fragment key={href}>
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground flex-shrink-0",
                hiddenOnMobile && "hidden sm:block",
              )}
            />
            {isLast ? (
              <span className="font-medium text-foreground whitespace-nowrap truncate">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap",
                  hiddenOnMobile && "hidden sm:inline",
                )}
              >
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
