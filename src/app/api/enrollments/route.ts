import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/enrollments - Get user enrollments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    // Get current user to enforce role-based filtering
    const currentUser = await getCurrentUser(request);

    // Build where clause based on role
    let whereClause: any = {
      ...(userId && { userId }),
      ...(courseId && { courseId }),
    };

    // Instructors can only view enrollments for their own courses
    if (currentUser?.role === 'INSTRUCTOR') {
      whereClause.course = {
        instructorId: currentUser.id,
      };
    }

    const enrollments = await prisma.enrollment.findMany({
      where: whereClause,
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
    let { userId, courseId } = body;

    // Get current user
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If no userId provided, use current user (self-enrollment)
    if (!userId) {
      userId = currentUser.id;
    }

    // Regular users can only enroll themselves
    if (currentUser.role === 'LEARNER' && userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'You can only enroll yourself' },
        { status: 403 }
      );
    }

    // Fetch course details to check access rule
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { 
        id: true,
        instructorId: true,
        accessRule: true,
        price: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if this is a paid course
    if (course.accessRule === 'PAYMENT') {
      // For paid courses, only allow enrollment if payment is completed
      const payment = await prisma.payment.findFirst({
        where: {
          userId: userId,
          courseId: courseId,
          status: 'COMPLETED',
        },
      });

      if (!payment) {
        return NextResponse.json(
          { 
            error: 'Payment required. Please complete payment first.',
            requiresPayment: true,
            price: course.price,
          },
          { status: 402 }
        );
      }
    }

    // Instructors can only enroll learners in their own courses
    if (currentUser.role === 'INSTRUCTOR') {
      if (course.instructorId !== currentUser.id) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only enroll learners in your own courses.' },
          { status: 403 }
        );
      }
    }

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
        user: { select: { email: true, name: true } },
        course: {
          include: {
            tags: true,
            lessons: { select: { id: true } },
          },
        },
      },
    });

    // Send Enrollment Email asynchronously
    if (enrollment.user.email) {
      const { sendEnrollmentEmail } = await import('@/lib/mail');
      const courseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/learn/${courseId}`;
      sendEnrollmentEmail(enrollment.user.email, enrollment.user.name || 'Learner', enrollment.course.title, courseUrl)
        .catch(err => console.error('Failed to send enrollment email:', err));
    }

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
  }
}
