import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/courses/[id] - Get single course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    return NextResponse.json({
      ...course,
      averageRating: Math.round(avgRating * 10) / 10,
      enrollmentsCount: course._count.enrollments,
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
    const body = await request.json();
    const {
      title,
      description,
      imageUrl,
      websiteUrl,
      isPublished,
      visibility,
      accessRule,
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
    await prisma.course.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
