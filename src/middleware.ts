import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Update the session
  const response = await updateSession(request);

  // Get the pathname
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/sign-in', '/sign-up', '/courses'];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/courses/')
  );

  // API routes should be handled separately
  if (pathname.startsWith('/api')) {
    return response;
  }

  // Protected routes
  const protectedRoutes = ['/admin', '/learner', '/learn'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Check for auth cookie (simplified check for demo)
    const authCookie = request.cookies.get('sb-fzjdrzihvveowdimbbks-auth-token');
    
    if (!authCookie) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
