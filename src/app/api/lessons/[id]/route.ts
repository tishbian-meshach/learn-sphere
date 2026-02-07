import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/lessons/[id] - Get single lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const currentUser = await getCurrentUser(request);

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        attachments: true,
        quiz: {
          include: {
            questions: {
              include: { options: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        course: {
          select: { id: true, title: true, instructorId: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Instructors can only view lessons from their own courses
    if (currentUser?.role === 'INSTRUCTOR' && lesson.course.instructorId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized. You can only view lessons from your own courses.' },
        { status: 403 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 });
  }
}

// PUT /api/lessons/[id] - Update lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership for instructors
    if (currentUser.role === 'INSTRUCTOR') {
      const lesson = await prisma.lesson.findUnique({
        where: { id: params.id },
        include: { course: { select: { instructorId: true } } },
      });

      if (!lesson) {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
      }

      if (lesson.course.instructorId !== currentUser.id) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only edit lessons in your own courses.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      videoUrl,
      duration,
      documentUrl,
      imageUrl,
      allowDownload,
      orderIndex,
    } = body;

    const lesson = await prisma.lesson.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
        ...(documentUrl !== undefined && { documentUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(allowDownload !== undefined && { allowDownload }),
        ...(orderIndex !== undefined && { orderIndex }),
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

// DELETE /api/lessons/[id] - Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      select: { 
        courseId: true, 
        duration: true,
        course: { select: { instructorId: true } }
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Check ownership for instructors
    if (currentUser.role === 'INSTRUCTOR' && lesson.course.instructorId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized. You can only delete lessons from your own courses.' },
        { status: 403 }
      );
    }

    await prisma.lesson.delete({
      where: { id: params.id },
    });

    // Update course total duration
    if (lesson?.duration) {
      await prisma.course.update({
        where: { id: lesson.courseId },
        data: { totalDuration: { decrement: lesson.duration } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}
