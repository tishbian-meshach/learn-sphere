import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/enrollments - Get user enrollments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    const enrollments = await prisma.enrollment.findMany({
      where: {
        ...(userId && { userId }),
        ...(courseId && { courseId }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        course: {
          include: {
            tags: true,
            instructor: {
              select: { id: true, name: true },
            },
            lessons: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

// POST /api/enrollments - Create enrollment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId } = body;

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE',
        startedAt: new Date(),
      },
      include: {
        course: {
          include: {
            tags: true,
            lessons: { select: { id: true } },
          },
        },
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
  }
}
