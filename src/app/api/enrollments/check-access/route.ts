import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Fetch course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        accessRule: true,
        price: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // If course is open, everyone has access
    if (course.accessRule === 'OPEN') {
      return NextResponse.json({ hasAccess: true, reason: 'OPEN_COURSE' });
    }

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (enrollment) {
      return NextResponse.json({ hasAccess: true, reason: 'ENROLLED' });
    }

    // For paid courses, check if there's a completed payment
    if (course.accessRule === 'PAYMENT') {
      const payment = await prisma.payment.findFirst({
        where: {
          userId: user.id,
          courseId: courseId,
          status: 'COMPLETED',
        },
      });

      if (payment) {
        return NextResponse.json({ hasAccess: true, reason: 'PAID' });
      }

      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'PAYMENT_REQUIRED',
        price: course.price 
      });
    }

    // For invitation-only courses
    if (course.accessRule === 'INVITATION') {
      return NextResponse.json({ hasAccess: false, reason: 'INVITATION_REQUIRED' });
    }

    return NextResponse.json({ hasAccess: false, reason: 'UNKNOWN' });
  } catch (error) {
    console.error('Error checking access:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}
