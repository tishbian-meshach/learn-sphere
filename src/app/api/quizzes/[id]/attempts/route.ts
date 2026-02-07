import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/quizzes/[id]/attempts - Submit quiz results
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, score, answers } = body; // score is the number of correct answers

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: { questions: true }
    });

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    // 1. Determine attempt number
    const previousAttempts = await prisma.quizAttempt.count({
      where: { userId, quizId: params.id }
    });
    const attemptNumber = previousAttempts + 1;

    // 2. Calculate points based on reward rules
    let pointsEarned = 0;
    // Only award points if they pass (e.g., 100% score for simplicity, or just award for attempt)
    // User requirement: "User earns points based on attempt reward rules"
    // We'll award points if the learner finishes the quiz
    if (attemptNumber === 1) pointsEarned = quiz.firstAttemptPoints;
    else if (attemptNumber === 2) pointsEarned = quiz.secondAttemptPoints;
    else if (attemptNumber === 3) pointsEarned = quiz.thirdAttemptPoints;
    else pointsEarned = quiz.fourthPlusPoints;

    // 3. Record attempt, update user points, and mark lesson progress
    const result = await prisma.$transaction(async (tx) => {
      // Create attempt record
      const attempt = await tx.quizAttempt.create({
        data: {
          userId,
          quizId: params.id,
          attemptNumber,
          score,
          pointsEarned,
        }
      });

      // Add points to user's total
      await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: { increment: pointsEarned }
        }
      });

      // Log points in ledger
      await tx.pointsLedger.create({
        data: {
          userId,
          points: pointsEarned,
          reason: `Completed Quiz: ${params.id} (Attempt #${attemptNumber})`
        }
      });

      // Mark lesson as completed
      await tx.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: quiz.lessonId } },
        update: { isCompleted: true, completedAt: new Date() },
        create: {
          userId,
          lessonId: quiz.lessonId,
          isCompleted: true,
          completedAt: new Date(),
        }
      });

      // If all lessons completed, mark course completed (simplified check here or handled by frontend event)
      // For now, focus on lesson completion

      return attempt;
    });

    return NextResponse.json({ 
      success: true, 
      pointsEarned, 
      attemptNumber,
      score 
    });
  } catch (error) {
    console.error('Error submitting attempt:', error);
    return NextResponse.json({ error: 'Failed to submit attempt' }, { status: 500 });
  }
}
