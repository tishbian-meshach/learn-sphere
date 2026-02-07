import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/quizzes/[id] - Fetch full quiz structure
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}

// PUT /api/quizzes/[id] - Update quiz content (questions, options, rewards)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { 
      firstAttemptPoints, 
      secondAttemptPoints, 
      thirdAttemptPoints, 
      fourthPlusPoints,
      questions 
    } = body;

    // 1. Update reward rules
    await prisma.quiz.update({
      where: { id: params.id },
      data: {
        firstAttemptPoints,
        secondAttemptPoints,
        thirdAttemptPoints,
        fourthPlusPoints,
      },
    });

    // 2. Handle Questions & Options via transaction for consistency
    if (questions) {
      await prisma.$transaction(async (tx) => {
        // Simple approach: Clear and recreate to avoid complex diffing logic for now
        // Delete all existing questions (cascades to options)
        await tx.question.deleteMany({
          where: { quizId: params.id },
        });

        // Recreate all
        for (const [idx, q] of questions.entries()) {
          await tx.question.create({
            data: {
              quizId: params.id,
              text: q.text,
              orderIndex: idx,
              options: {
                create: q.options.map((o: any) => ({
                  text: o.text,
                  isCorrect: o.isCorrect,
                })),
              },
            },
          });
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
}

// DELETE /api/quizzes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.quiz.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}
