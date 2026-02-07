import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/courses/[id]/lessons - Get all lessons for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user to enforce role-based access
    const currentUser = await getCurrentUser(request);
    
    // Instructors can only view lessons from their own courses
    if (currentUser?.role === 'INSTRUCTOR') {
      const course = await prisma.course.findUnique({
        where: { id: params.id },
        select: { instructorId: true },
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      if (course.instructorId !== currentUser.id) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only view lessons from your own courses.' },
          { status: 403 }
        );
      }
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId: params.id },
      orderBy: { orderIndex: 'asc' },
      include: {
        attachments: true,
        quiz: {
          select: {
            id: true,
            _count: { select: { questions: true } },
          },
        },
      },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

// POST /api/courses/[id]/lessons - Create a new lesson
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Instructors can only add lessons to their own courses
    if (currentUser.role === 'INSTRUCTOR') {
      const course = await prisma.course.findUnique({
        where: { id: params.id },
        select: { instructorId: true },
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      if (course.instructorId !== currentUser.id) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only add lessons to your own courses.' },
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
    } = body;

    // Get the next order index
    const lastLesson = await prisma.lesson.findFirst({
      where: { courseId: params.id },
      orderBy: { orderIndex: 'desc' },
    });
    const orderIndex = (lastLesson?.orderIndex ?? -1) + 1;

    // Create the lesson and associated Quiz if type is QUIZ
    const lesson = await prisma.$transaction(async (tx) => {
      const newLesson = await tx.lesson.create({
        data: {
          title,
          description,
          type: type || 'VIDEO',
          videoUrl,
          duration: duration ? parseInt(duration) : null,
          documentUrl,
          imageUrl,
          allowDownload: allowDownload || false,
          orderIndex,
          courseId: params.id,
        },
        include: {
          attachments: true,
        },
      });

      if (type === 'QUIZ') {
        await tx.quiz.create({
          data: {
            lessonId: newLesson.id,
            firstAttemptPoints: 100,
            secondAttemptPoints: 75,
            thirdAttemptPoints: 50,
            fourthPlusPoints: 25,
          }
        });
      }

      return newLesson;
    });

    // Update course total duration
    if (duration) {
      await prisma.course.update({
        where: { id: params.id },
        data: { totalDuration: { increment: parseInt(duration) } },
      });
    }

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}
