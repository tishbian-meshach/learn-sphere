'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!sessionId || isProcessing) {
      if (!sessionId) setStatus('error');
      return;
    }

    // Complete payment and create enrollment
    const completePayment = async () => {
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/payments/complete?session_id=${sessionId}`, {
          method: 'POST',
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setCourseId(data.courseId);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error completing payment:', error);
        setStatus('error');
      } finally {
        setIsProcessing(false);
      }
    };

    completePayment();
  }, [sessionId, isProcessing]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Processing Payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your enrollment.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">
            There was an issue processing your payment. Please try again or contact support.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/learner/courses')}
              className="w-full"
            >
              Back to Courses
            </Button>
            <Button
              onClick={() => router.push('/learner/profile')}
              variant="ghost"
              className="w-full"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Congratulations! You have successfully enrolled in the course. You can now start learning.
        </p>
        <div className="space-y-3">
          {courseId && (
            <Button
              onClick={() => router.push(`/learn/${courseId}`)}
              className="w-full"
            >
              Start Course
            </Button>
          )}
          <Button
            onClick={() => router.push('/learner/my-courses')}
            variant="outline"
            className="w-full"
          >
            View My Courses
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Initializing...</h2>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
