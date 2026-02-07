import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    let quiz = await prisma.quiz.findUnique({
      where: { lessonId: params.lessonId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: true,
          },
        },
      },
    });

    // Auto-repair if lesson is QUIZ but record is missing
    if (!quiz) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: params.lessonId },
        select: { type: true }
      });

      if (lesson?.type === 'QUIZ') {
        quiz = await prisma.quiz.create({
          data: {
            lessonId: params.lessonId,
            firstAttemptPoints: 100,
            secondAttemptPoints: 75,
            thirdAttemptPoints: 50,
            fourthPlusPoints: 25,
          },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: { options: true }
            }
          }
        }) as any;
      }
    }

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz by lesson:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}
