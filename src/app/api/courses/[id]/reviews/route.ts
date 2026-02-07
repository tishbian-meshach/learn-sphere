import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/courses/[id]/reviews - Get course reviews
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await prisma.review.findMany({
      where: { courseId: params.id },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({ reviews, averageRating: Math.round(avgRating * 10) / 10 });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/courses/[id]/reviews - Create review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, rating, comment } = body;

    // Check enrollment and completion status
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: params.id,
        },
      },
    });

    if (!enrollment || enrollment.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'You must complete the course before leaving a review.' },
        { status: 403 }
      );
    }

    // Check if user already reviewed
    const existing = await prisma.review.findUnique({
      where: { userId_courseId: { userId, courseId: params.id } },
    });

    if (existing) {
      // Update existing review
      const review = await prisma.review.update({
        where: { id: existing.id },
        data: { rating, comment },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });
      return NextResponse.json(review);
    }

    const review = await prisma.review.create({
      data: {
        userId,
        courseId: params.id,
        rating,
        comment,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
