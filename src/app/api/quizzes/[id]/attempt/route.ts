import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBadgeLevel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// POST /api/quizzes/[id]/attempt - Submit quiz attempt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, answers } = body;

    // Get quiz with questions and options
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: { options: true },
        },
        lesson: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Calculate score
    let correctCount = 0;
    for (const question of quiz.questions) {
      const userAnswer = answers[question.id];
      const correctOption = question.options.find((o) => o.isCorrect);
      if (correctOption && userAnswer === correctOption.id) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / quiz.questions.length) * 100);

    // Count previous attempts
    const prevAttempts = await prisma.quizAttempt.count({
      where: { userId, quizId: params.id },
    });
    const attemptNumber = prevAttempts + 1;

    // Calculate points based on attempt number
    let pointsEarned = quiz.fourthPlusPoints;
    if (attemptNumber === 1) pointsEarned = quiz.firstAttemptPoints;
    else if (attemptNumber === 2) pointsEarned = quiz.secondAttemptPoints;
    else if (attemptNumber === 3) pointsEarned = quiz.thirdAttemptPoints;

    // Scale points by score
    pointsEarned = Math.round((pointsEarned * score) / 100);

    // Create attempt record
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId: params.id,
        attemptNumber,
        score,
        pointsEarned,
      },
    });

    // Calculate new total points with a cap of 120
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true, badgeLevel: true }
    });

    const currentTotal = currentUser?.totalPoints || 0;
    const newTotalPoints = Math.min(currentTotal + pointsEarned, 120);

    // Update user points
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: newTotalPoints,
      },
    });

    const newBadgeLevel = getBadgeLevel(user.totalPoints);
    if (newBadgeLevel !== user.badgeLevel) {
      await prisma.user.update({
        where: { id: userId },
        data: { badgeLevel: newBadgeLevel },
      });
    }

    // Add to points ledger
    await prisma.pointsLedger.create({
      data: {
        userId,
        points: pointsEarned,
        reason: `Quiz completed: ${quiz.lesson.title} (Attempt ${attemptNumber})`,
      },
    });

    // Mark lesson as completed
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: quiz.lessonId } },
      update: { isCompleted: true, completedAt: new Date() },
      create: {
        userId,
        lessonId: quiz.lessonId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      attempt,
      score,
      pointsEarned,
      correctCount,
      totalQuestions: quiz.questions.length,
      newTotalPoints: user.totalPoints + pointsEarned,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}

// GET /api/quizzes/[id]/attempt - Get user's attempts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: params.id, userId },
      orderBy: { completedAt: 'desc' },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
  }
}
