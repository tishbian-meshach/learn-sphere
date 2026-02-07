import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/users/[id] - Get user dossier with full performance data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                level: true,
                subject: true,
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        lessonProgress: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                type: true,
                course: {
                  select: { title: true }
                }
              },
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 10,
        },
        // Role-specific data: Instructors authored content
        coursesCreated: {
          include: {
            _count: { select: { enrollments: true } },
            tags: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Subject not found in registry' }, { status: 404 });
    }

    const completedCoursesCount = user.enrollments.filter(e => e.status === 'COMPLETED').length;
    const badgePoints = Math.min(completedCoursesCount * 20, 120);

    return NextResponse.json({
      ...user,
      badgePoints,
      completedCoursesCount,
    });
  } catch (error) {
    console.error('Error fetching subject dossier:', error);
    return NextResponse.json({ error: 'Failed to retrieve dossier' }, { status: 500 });
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
// PATCH /api/users/[id] - Update user role (ADMIN ONLY)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { role } = await request.json();
    
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error patching user:', error);
    return NextResponse.json({ error: 'Failed to update user authorization' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Terminate user account (ADMIN ONLY)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to terminate user account' }, { status: 500 });
  }
}
