import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client'; // Import UserRole enum

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req: NextRequestWithAuth) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    const isAuthenticated = !!token;
    const userRole = token?.role as UserRole | undefined;

    // Redirect authenticated users from auth pages (login, register)
    if (isAuthenticated && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Protect admin routes: only ADMIN role can access /admin/**
    if (pathname.startsWith('/admin')) {
      if (!isAuthenticated) { // Should be caught by general auth check, but good to be explicit
        return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${encodeURIComponent(req.url)}`, req.url));
      }
      if (userRole !== UserRole.ADMIN) {
        // Redirect to a 'forbidden' page or the main dashboard
        return NextResponse.rewrite(new URL('/dashboard?error=forbidden_admin', req.url)); // Use rewrite to show error on dashboard or a dedicated forbidden page
      }
    }

    // Example: Protecting routes that require CR or ADMIN roles
    // e.g., if there was a dedicated page for creating classrooms like `/classrooms/new`
    // The current app structure uses modals and API checks, which is also fine.
    // This is for page-level protection.
    /*
    const crOrAdminRoutes = ['/classrooms/new', '/classrooms/manage'];
    if (crOrAdminRoutes.some(route => pathname.startsWith(route))) {
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${encodeURIComponent(req.url)}`, req.url));
      }
      if (userRole !== UserRole.CR && userRole !== UserRole.ADMIN) {
        return NextResponse.rewrite(new URL('/dashboard?error=forbidden_cr', req.url));
      }
    }
    */

    // General protection for other application routes that require authentication
    // If a route is not public and not an auth page, it requires authentication.
    // The `authorized` callback in `withAuth` handles the base authentication check.
    // So, if we reach here and the route is not public (e.g. landing page '/'),
    // `withAuth` would have already redirected if not authenticated.

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // If trying to access auth pages, always allow (middleware func will handle redirect if already auth)
        if (pathname.startsWith('/auth')) {
          return true;
        }
        // For any other page, token must exist (user must be authenticated)
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, manifest.json, sw.js etc.)
     * - The root path / (landing page, assuming it's public)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json|sw.js|robots.txt|site.webmanifest|$).*)',
    // Include auth pages for redirect logic if user is already authenticated
    '/auth/login',
    '/auth/register',
  ],
};