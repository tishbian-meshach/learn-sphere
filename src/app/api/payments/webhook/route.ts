import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('🎉 Webhook received: checkout.session.completed', session.id);

      const { userId, courseId } = session.metadata as { userId: string; courseId: string };

      if (!userId || !courseId) {
        console.error('❌ Missing metadata in session:', session.id);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      console.log(`👤 User: ${userId}, 📚 Course: ${courseId}`);

      // Update payment status
      const payment = await prisma.payment.findUnique({
        where: { stripeSessionId: session.id },
      });

      if (!payment) {
        console.error('❌ Payment not found for session:', session.id);
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      console.log(`💰 Payment found: ${payment.id}`);

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          stripePaymentId: session.payment_intent as string,
        },
        include: {
          user: { select: { email: true, name: true } },
          course: { select: { title: true } },
        },
      });

      console.log(`✅ Payment updated to COMPLETED`);

      // Send Payment Success Email
      if (updatedPayment.user?.email) {
        const { sendPaymentSuccessEmail } = await import('@/lib/mail');
        sendPaymentSuccessEmail(
          updatedPayment.user.email,
          updatedPayment.user.name || 'Learner',
          updatedPayment.course.title,
          session.amount_total || 0,
          session.id
        ).catch(err => console.error('Failed to send payment email:', err));
      }

      // Check if enrollment already exists
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: courseId,
          },
        },
      });

      if (!existingEnrollment) {
        // Create enrollment
        const newEnrollment = await prisma.enrollment.create({
          data: {
            userId: userId,
            courseId: courseId,
            status: 'ACTIVE',
            startedAt: new Date(),
            progress: 0,
          },
        });

        console.log(`✅ Enrollment created: ${newEnrollment.id} for user ${userId} in course ${courseId}`);
      } else {
        console.log(`⚠️ Enrollment already exists: ${existingEnrollment.id}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
