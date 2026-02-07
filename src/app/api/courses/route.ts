import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/courses - List all courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const published = searchParams.get('published');
    const instructorId = searchParams.get('instructorId');
    const userId = searchParams.get('userId');

    // Get current user to enforce role-based filtering
    const currentUser = await getCurrentUser(request);
    
    // If instructor, only show their own courses
    const instructorFilter = currentUser?.role === 'INSTRUCTOR' 
      ? { instructorId: currentUser.id }
      : instructorId 
        ? { instructorId }
        : {};

    const courses = await prisma.course.findMany({
      where: {
        ...(search && {
          title: { contains: search, mode: 'insensitive' },
        }),
        ...(published !== null && { isPublished: published === 'true' }),
        ...instructorFilter,
      },
      include: {
        instructor: {
          select: { id: true, name: true, avatarUrl: true },
        },
        tags: true,
        lessons: {
          select: { id: true, duration: true },
        },
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
        ...(userId && {
          enrollments: {
            where: { userId },
            select: { status: true, progress: true }
          }
        }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data to ensure frontend gets the _count structure it expects
    const coursesWithStats = courses.map((course) => {
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0;

      return {
        ...course,
        _count: {
          lessons: course.lessons.length,
          enrollments: course._count.enrollments,
          reviews: course._count.reviews,
        },
        averageRating: Math.round(avgRating * 10) / 10,
        // Check if user is enrolled and their progress
        userStatus: userId && course.enrollments?.[0] ? {
          enrolled: true,
          status: course.enrollments[0].status,
          progress: course.enrollments[0].progress,
        } : { enrolled: false },
        
        // Keep lessons relation for totalDuration calculation but it's not needed in the final JSON for list views
        totalDuration: course.lessons.reduce((sum, l) => sum + (l.duration || 0), 0),
        lessons: undefined,
        reviews: undefined,
        enrollments: undefined,
        price: course.price ? Number(course.price) : 0,
      };
    });

    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      imageUrl,
      websiteUrl,
      visibility,
      accessRule,
      price,
      instructorId,
      tags,
    } = body;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        imageUrl,
        websiteUrl,
        visibility: visibility || 'EVERYONE',
        accessRule: accessRule || 'OPEN',
        price: price ? parseFloat(price) : null,
        instructorId,
        tags: tags?.length
          ? {
              create: tags.map((tag: string) => ({ name: tag })),
            }
          : undefined,
      },
      include: {
        instructor: {
          select: { id: true, name: true, avatarUrl: true },
        },
        tags: true,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
