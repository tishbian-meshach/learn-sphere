import { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

/**
 * Get the authenticated user's profile from the request
 */
export async function getCurrentUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
    },
  });

  return profile;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user?.role === 'ADMIN';
}

/**
 * Check if the current user is an instructor
 */
export async function isInstructor(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user?.role === 'INSTRUCTOR';
}
