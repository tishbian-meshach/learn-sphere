import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/users/[id] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        totalPoints: true,
        badgeLevel: true,
      },
    });

    const completedCoursesCount = await prisma.enrollment.count({
      where: { userId: params.id, status: 'COMPLETED' },
    });

    const badgePoints = Math.min(completedCoursesCount * 20, 120);

    return NextResponse.json({
      ...user,
      badgePoints,
      completedCourses: completedCoursesCount,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, avatarUrl } = body;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(avatarUrl && { avatarUrl }),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
