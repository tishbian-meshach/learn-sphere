import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Fetch course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        price: true,
        accessRule: true,
        imageUrl: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.accessRule !== 'PAYMENT') {
      return NextResponse.json({ error: 'This course is not a paid course' }, { status: 400 });
    }

    if (!course.price || Number(course.price) <= 0) {
      return NextResponse.json({ error: 'Course price is not set' }, { status: 400 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 });
    }

    // Check if there's already a pending payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        courseId: courseId,
        status: 'COMPLETED',
      },
    });

    if (existingPayment) {
      return NextResponse.json({ error: 'Payment already completed for this course' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: course.title,
              images: course.imageUrl ? [course.imageUrl] : [],
            },
            unit_amount: Math.round(Number(course.price) * 100), // Convert to paise
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/learner/courses`,
      metadata: {
        userId: user.id,
        courseId: courseId,
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: user.id,
        courseId: courseId,
        stripeSessionId: session.id,
        amount: course.price,
        currency: 'inr',
        status: 'PENDING',
      },
    });

    console.log(`💳 Payment session created: ${session.id} for user ${user.id}, course ${courseId}`);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
