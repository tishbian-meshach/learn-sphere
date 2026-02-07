import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBadgeLevel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// PUT /api/progress - Update lesson progress
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, lessonId, isCompleted, timeSpent } = body;

    // Get the lesson to find the course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Upsert lesson progress
    const progress = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        isCompleted: isCompleted ?? undefined,
        completedAt: isCompleted ? new Date() : undefined,
        timeSpent: timeSpent ? { increment: timeSpent } : undefined,
      },
      create: {
        userId,
        lessonId,
        isCompleted: isCompleted || false,
        completedAt: isCompleted ? new Date() : null,
        timeSpent: timeSpent || 0,
      },
    });

    // Recalculate course progress
    const allLessons = await prisma.lesson.count({
      where: { courseId: lesson.courseId },
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        isCompleted: true,
        lesson: { courseId: lesson.courseId },
      },
    });

    const courseProgress = allLessons > 0 ? (completedLessons / allLessons) * 100 : 0;

    // Update enrollment progress
    await prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
      data: {
        progress: courseProgress,
        timeSpent: timeSpent ? { increment: timeSpent } : undefined,
        completedAt: courseProgress >= 100 ? new Date() : null,
        status: courseProgress >= 100 ? 'COMPLETED' : 'ACTIVE',
      },
    });

    return NextResponse.json({ progress, courseProgress });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}

// GET /api/progress - Get lesson progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    if (lessonId && userId) {
      const progress = await prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
      return NextResponse.json(progress || { isCompleted: false });
    }

    if (courseId && userId) {
      const progress = await prisma.lessonProgress.findMany({
        where: {
          userId,
          lesson: { courseId },
        },
      });
      return NextResponse.json(progress);
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
