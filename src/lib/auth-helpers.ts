import { NextRequest, NextResponse } from 'next/server';
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
/**
 * verifyCourseLock - Checks if a course is locked by someone else.
 * Returns null if lock is available or held by current user.
 * Returns NextResponse if locked.
 */
export async function verifyCourseLock(request: NextRequest, courseId: string) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      editingUserId: true,
      editingExpiresAt: true,
    },
  });

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const now = new Date();
  if (
    course.editingUserId &&
    course.editingUserId !== currentUser.id &&
    course.editingExpiresAt &&
    course.editingExpiresAt > now
  ) {
    return NextResponse.json({
      error: 'Someone is already in access',
      message: 'This course is currently being edited by another user. Your changes cannot be saved at this time.'
    }, { status: 423 });
  }

  return null;
}
