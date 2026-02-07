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
    const visibility = searchParams.get('visibility');
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

    // Enforce visibility/published logic for Learners or unauthenticated requests
    const isSpecialRole = currentUser?.role === 'ADMIN' || currentUser?.role === 'INSTRUCTOR';
    
    // Base where clause
    const whereClause: any = {
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
      ...instructorFilter,
    };

    // Published filter: learners/guests only see published courses
    if (!isSpecialRole) {
      whereClause.isPublished = true;
    } else if (published !== null) {
      whereClause.isPublished = published === 'true';
    }

    // Visibility filter
    if (visibility) {
      whereClause.visibility = visibility as any;
    } else if (!isSpecialRole) {
      // For learners/guests: show EVERYONE or SIGNED_IN (if logged in) courses
      // Exclude INVITATION visibility unless they're enrolled
      whereClause.visibility = currentUser ? { in: ['EVERYONE', 'SIGNED_IN'] } : 'EVERYONE';
    }
    
    const courses = await prisma.course.findMany({
      where: whereClause,
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

    // For learners: also fetch INVITATION visibility courses they're enrolled in
    let invitationCourses: any[] = [];
    if (!isSpecialRole && userId && currentUser) {
      invitationCourses = await prisma.course.findMany({
        where: {
          visibility: 'INVITATION',
          isPublished: true,
          enrollments: {
            some: { userId: currentUser.id }
          },
          ...(search && {
            title: { contains: search, mode: 'insensitive' },
          }),
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
          enrollments: {
            where: { userId },
            select: { status: true, progress: true }
          },
        },
      });
    }

    // Merge courses and remove duplicates
    const allCourses = [...courses, ...invitationCourses].reduce((acc: any[], course: any) => {
      if (!acc.find((c: any) => c.id === course.id)) {
        acc.push(course);
      }
      return acc;
    }, [] as any[]);

    // Transform data to ensure frontend gets the _count structure it expects
    const coursesWithStats = allCourses.map((course: any) => {
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / course.reviews.length
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
        totalDuration: course.lessons.reduce((sum: number, l: any) => sum + (l.duration || 0), 0),
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

    // Auto-determine accessRule based on price
    const parsedPrice = price ? parseFloat(price) : null;
    const finalAccessRule = parsedPrice && parsedPrice > 0 ? 'PAYMENT' : 'OPEN';

    const course = await prisma.course.create({
      data: {
        title,
        description,
        imageUrl,
        websiteUrl,
        visibility: visibility || 'EVERYONE',
        accessRule: finalAccessRule, // Auto-set based on price
        price: parsedPrice,
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
