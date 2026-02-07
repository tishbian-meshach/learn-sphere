import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/lessons/[id] - Get single lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
          select: { id: true, title: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
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
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      select: { courseId: true, duration: true },
    });

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
