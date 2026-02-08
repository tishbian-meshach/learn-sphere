import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCourseLock } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/courses/[id]/lessons/[lessonId] - Get single lesson details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        attachments: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json({ error: 'Failed to fetch module details' }, { status: 500 });
  }
}

// PUT /api/courses/[id]/lessons/[lessonId] - Update lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    // Check course lock
    const lockError = await verifyCourseLock(request, params.id);
    if (lockError) return lockError;

    const body = await request.json();
    const {
      title,
      description,
      type,
      videoUrl,
      duration,
      documentUrl,
      imageUrl,
      responsible,
      allowDownload,
      attachments, // Array of { id?, name, url, isExternal }
    } = body;

    // Update the lesson
    // Use transaction to ensure consistency if type changes to QUIZ
    const updatedLesson = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.update({
        where: { id: params.lessonId },
        data: {
          title,
          description,
          type,
          videoUrl,
          duration: duration ? parseInt(duration.toString()) : null,
          documentUrl,
          imageUrl,
          responsible,
          allowDownload,
        },
      });

      if (type === 'QUIZ') {
        // Upsert the quiz record to ensure it exists
        await tx.quiz.upsert({
          where: { lessonId: params.lessonId },
          create: {
            lessonId: params.lessonId,
            firstAttemptPoints: 100,
            secondAttemptPoints: 75,
            thirdAttemptPoints: 50,
            fourthPlusPoints: 25,
          },
          update: {}, // Don't change points if it already exists
        });
      }

      return lesson;
    });

    // Handle attachments if provided
    if (attachments && Array.isArray(attachments)) {
      // Simple strategy: delete existing and recreate for this MVP
      // Better strategy would be diffing IDs
      await prisma.lessonAttachment.deleteMany({
        where: { lessonId: params.lessonId },
      });

      if (attachments.length > 0) {
        await prisma.lessonAttachment.createMany({
          data: attachments.map((a: any) => ({
            name: a.name,
            url: a.url,
            isExternal: a.isExternal || false,
            lessonId: params.lessonId,
          })),
        });
      }
    }

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
  }
}

// DELETE /api/courses/[id]/lessons/[lessonId] - Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    // Check course lock
    const lockError = await verifyCourseLock(request, params.id);
    if (lockError) return lockError;

    // Get lesson to subtract duration from course if needed
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      select: { duration: true },
    });

    await prisma.lesson.delete({
      where: { id: params.lessonId },
    });

    // Update course total duration if the lesson had duration
    if (lesson?.duration) {
      await prisma.course.update({
        where: { id: params.id },
        data: { totalDuration: { decrement: lesson.duration } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
  }
}
