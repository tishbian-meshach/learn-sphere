import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// POST /api/courses/[id]/lock - Acquire or refresh a lock
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'INSTRUCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = params.id;
    const now = new Date();
    const lockDurationMs = 30 * 1000; // 30 seconds lock duration for heartbeat
    const expiresAt = new Date(now.getTime() + lockDurationMs);

    // Find the course and check existing lock
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        editingUserId: true,
        editingExpiresAt: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if someone else holds a valid lock
    if (
      course.editingUserId && 
      course.editingUserId !== currentUser.id && 
      course.editingExpiresAt && 
      course.editingExpiresAt > now
    ) {
      // Get the name of the person editing
      const otherUser = await prisma.user.findUnique({
        where: { id: course.editingUserId },
        select: { name: true, email: true }
      });

      return NextResponse.json({ 
        error: 'Someone is already in access', 
        message: `${otherUser?.name || otherUser?.email || 'Another admin'} is currently editing this course. Please try again later.`,
        lockedBy: otherUser?.name || 'Another admin'
      }, { status: 423 }); // Locked (WebDAV/RFC 4918)
    }

    // Acquire or refresh the lock
    await prisma.course.update({
      where: { id: courseId },
      data: {
        editingUserId: currentUser.id,
        editingExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({ 
      success: true, 
      expiresAt: expiresAt.toISOString() 
    });

  } catch (error) {
    console.error('Error locking course:', error);
    return NextResponse.json({ error: 'Failed to lock course' }, { status: 500 });
  }
}

// DELETE /api/courses/[id]/lock - Release a lock
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = params.id;

    // Only release if the current user is the one who holds the lock
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { editingUserId: true },
    });

    if (course?.editingUserId === currentUser.id) {
      await prisma.course.update({
        where: { id: courseId },
        data: {
          editingUserId: null,
          editingExpiresAt: null,
        },
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error releasing course lock:', error);
    return NextResponse.json({ error: 'Failed to release lock' }, { status: 500 });
  }
}
