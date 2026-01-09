import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Admin-only routes that require ADMIN role
const ADMIN_ROUTES = [
  "/master-data/plants",
  "/master-data/lines",
  "/master-data/machines",
  "/master-data/shifts",
  "/master-data/parts",
  "/master-data/reject-criteria",
  "/master-data/pdt-categories",
  "/master-data/updt-categories",
  "/users",
];

// Helper function to check if path matches admin routes
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const isOnLoginPage = req.nextUrl.pathname === "/login";
  const isOnRoot = req.nextUrl.pathname === "/";
  const pathname = req.nextUrl.pathname;

  // If not logged in and not on login page, redirect to login
  if (!isLoggedIn && !isOnLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  // If logged in and on login page, redirect to dashboard
  if (isLoggedIn && (isOnLoginPage || isOnRoot)) {
    return NextResponse.redirect(
      new URL("/dashboard/general", req.nextUrl.origin),
    );
  }

  // Check admin-only routes
  if (isLoggedIn && isAdminRoute(pathname)) {
    if (userRole !== "ADMIN") {
      // User is not admin, redirect to dashboard with error
      const url = new URL("/dashboard/general", req.nextUrl.origin);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (png, svg, jpg, jpeg, gif, webp)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp)).*)",
  ],
};
