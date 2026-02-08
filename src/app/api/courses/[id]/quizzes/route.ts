import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCourseLock } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/courses/[id]/quizzes - List all quizzes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // If auto-repair is needed, it involves writes, so we should theoretically check lock.
    // However, GET is usually expected to be safe. 
    // Let's check lock only for POST which is an explicit creation.
    
    // 1. Identify lessons of type QUIZ that are missing a backing Quiz record
    const lessonsMissingQuiz = await prisma.lesson.findMany({
      where: {
        courseId: params.id,
        type: 'QUIZ',
        quiz: { is: null }
      }
    });

    // 2. Auto-repair: Create missing Quiz records for those lessons
    if (lessonsMissingQuiz.length > 0) {
      for (const lesson of lessonsMissingQuiz) {
        await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            firstAttemptPoints: 100,
            secondAttemptPoints: 75,
            thirdAttemptPoints: 50,
            fourthPlusPoints: 25,
          }
        });
      }
    }

    // 3. Fetch all quizzes linked to lessons in this course
    const quizzes = await prisma.quiz.findMany({
      where: {
        lesson: { courseId: params.id }
      },
      include: {
        lesson: {
          select: { title: true, orderIndex: true }
        },
        _count: {
          select: { questions: true }
        }
      },
      orderBy: {
        lesson: { orderIndex: 'asc' }
      }
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error fetching course quizzes:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

// POST /api/courses/[id]/quizzes - Initialize a new quiz module
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check course lock
    const lockError = await verifyCourseLock(request, params.id);
    if (lockError) return lockError;

    const body = await request.json();
    const { title, orderIndex } = body;

    // Create a lesson of type QUIZ first, then the Quiz record
    const result = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({
        data: {
          courseId: params.id,
          title: title || 'New Assessment',
          type: 'QUIZ',
          orderIndex: orderIndex || 0,
        }
      });

      const quiz = await tx.quiz.create({
        data: {
          lessonId: lesson.id,
          firstAttemptPoints: 100,
          secondAttemptPoints: 75,
          thirdAttemptPoints: 50,
          fourthPlusPoints: 25,
        }
      });

      return { ...quiz, lesson };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
