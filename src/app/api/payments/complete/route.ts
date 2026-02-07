import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const { userId, courseId } = session.metadata as { userId: string; courseId: string };

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    // Update payment
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (payment && payment.status !== 'COMPLETED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          stripePaymentId: session.payment_intent as string,
        },
      });
    }

    // Check and create enrollment
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!existingEnrollment) {
      try {
        await prisma.enrollment.create({
          data: {
            userId,
            courseId,
            status: 'ACTIVE',
            startedAt: new Date(),
            progress: 0,
          },
        });
        console.log(`✅ Enrollment created for user ${userId} in course ${courseId}`);
      } catch (error: any) {
        // Ignore duplicate enrollment errors (P2002) - means it was already created
        if (error.code !== 'P2002') {
          throw error;
        }
        console.log(`ℹ️  Enrollment already exists for user ${userId} in course ${courseId}`);
      }
    }

    return NextResponse.json({ success: true, courseId });
  } catch (error) {
    console.error('Error completing payment:', error);
    return NextResponse.json({ error: 'Failed to complete payment' }, { status: 500 });
  }
}
