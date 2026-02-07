import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ success: false, error: 'Payment not completed' }, { status: 400 });
    }

    // Find payment in database
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    // Check enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: payment.userId,
          courseId: payment.courseId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      courseId: payment.courseId,
      enrolled: !!enrollment,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
