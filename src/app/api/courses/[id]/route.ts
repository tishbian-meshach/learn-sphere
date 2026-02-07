import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/courses/[id] - Get single course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user to enforce role-based access
    const currentUser = await getCurrentUser(request);
    
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        instructor: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
        tags: true,
        lessons: {
          orderBy: { orderIndex: 'asc' },
          include: {
            attachments: true,
            quiz: {
              include: {
                questions: {
                  include: { options: true },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Instructors can only view their own courses
    if (currentUser?.role === 'INSTRUCTOR' && course.instructorId !== currentUser.id) {
      return NextResponse.json({ error: 'Unauthorized. You can only view your own courses.' }, { status: 403 });
    }

    // Increment view count
    await prisma.course.update({
      where: { id: params.id },
      data: { viewsCount: { increment: 1 } },
    });

    // Calculate average rating
    const avgRating =
      course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0;

    // Fetch user status if logged in
    let userStatus = null;
    if (currentUser) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: currentUser.id,
            courseId: params.id,
          },
        },
        select: { status: true },
      });
      userStatus = enrollment?.status || null;
    }

    return NextResponse.json({
      ...course,
      averageRating: Math.round(avgRating * 10) / 10,
      enrollmentsCount: course._count.enrollments,
      userStatus,
      _count: undefined,
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

// PUT /api/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership for instructors
    if (currentUser.role === 'INSTRUCTOR') {
      const course = await prisma.course.findUnique({
        where: { id: params.id },
        select: { instructorId: true },
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      if (course.instructorId !== currentUser.id) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only edit your own courses.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      title,
      description,
      imageUrl,
      websiteUrl,
      isPublished,
      visibility,
      accessRule,
      level,
      subject,
      price,
      tags,
    } = body;

    // Delete existing tags if new ones provided
    if (tags !== undefined) {
      await prisma.courseTag.deleteMany({
        where: { courseId: params.id },
      });
    }

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(isPublished !== undefined && { isPublished }),
        ...(visibility && { visibility }),
        ...(accessRule && { accessRule }),
        ...(level !== undefined && { level }),
        ...(subject !== undefined && { subject }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(tags?.length && {
          tags: {
            create: tags.map((tag: string) => ({ name: tag })),
          },
        }),
      },
      include: {
        instructor: {
          select: { id: true, name: true, avatarUrl: true },
        },
        tags: true,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership for instructors
    if (currentUser.role === 'INSTRUCTOR') {
      const course = await prisma.course.findUnique({
        where: { id: params.id },
        select: { instructorId: true },
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      if (course.instructorId !== currentUser.id) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only delete your own courses.' },
          { status: 403 }
        );
      }
    }

    await prisma.course.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
