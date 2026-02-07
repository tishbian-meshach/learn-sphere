import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  // admin, learner, learn are protected
  const protectedRoutes = ['/admin', '/learner', '/learn'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Role-based route protection for instructors
  if (user) {
    // Fetch user role from API
    const userRes = await fetch(`${request.nextUrl.origin}/api/users/${user.id}`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (userRes.ok) {
      const userProfile = await userRes.json();
      
      // Block instructors from admin-only routes
      const instructorBlockedRoutes = ['/admin/users', '/admin/settings'];
      const isInstructorBlockedRoute = instructorBlockedRoutes.some((route) => pathname.startsWith(route));
      
      if (userProfile.role === 'INSTRUCTOR' && isInstructorBlockedRoute) {
        return NextResponse.json(
          { error: 'Unauthorized. Instructors cannot access this page.' },
          { status: 403 }
        );
      }
    }
  }

  // Redirect logged in users away from auth pages
  if (user && (pathname === '/sign-in' || pathname === '/sign-up')) {
    // If we have a user and they are on sign-in/sign-up, they should be redirected
    // to their respective dashboards. Since middleware doesn't easily know the role
    // from Prisma, we'll redirect to a common loading/callback page or just let
    // the page's own useEffect handle it. 
    // For now, let's redirect to / as a safe default or keep it simple.
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
