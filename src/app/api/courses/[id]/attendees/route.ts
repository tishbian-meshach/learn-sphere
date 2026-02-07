import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'INSTRUCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If instructor, check ownership
    if (currentUser.role === 'INSTRUCTOR') {
      const course = await prisma.course.findUnique({
        where: { id: params.id },
        select: { instructorId: true }
      });
      if (!course || course.instructorId !== currentUser.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            badgeLevel: true,
            totalPoints: true,
            lessonProgress: {
              where: {
                lesson: {
                  courseId: params.id
                }
              },
              select: {
                timeSpent: true,
                isCompleted: true,
                lesson: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'INSTRUCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        instructor: {
          select: { name: true }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (!course.isPublished) {
      return NextResponse.json({ error: 'Automated invitations are restricted to published courses only.' }, { status: 400 });
    }

    // Security check for instructors
    if (currentUser.role === 'INSTRUCTOR' && course.instructorId !== currentUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { sendInviteEmail } = await import('@/lib/mail');
    const domain = 'https://elearnsphere.vercel.app';
    const courseUrl = `${domain}/learn/${params.id}`;
    
    await sendInviteEmail(
      email,
      course.title,
      courseUrl,
      course.instructor?.name || 'Your Instructor'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
