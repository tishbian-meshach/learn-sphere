import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/courses/[id]/lessons - Get all lessons for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const lesson = await prisma.lesson.create({
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
