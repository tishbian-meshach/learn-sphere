'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Loader2, Lock } from 'lucide-react';

interface CourseEnrollButtonProps {
  courseId: string;
  accessRule: 'OPEN' | 'INVITATION' | 'PAYMENT';
  price?: number;
  isEnrolled?: boolean;
  onEnrollSuccess?: () => void;
}

export function CourseEnrollButton({
  courseId,
  accessRule,
  price,
  isEnrolled = false,
  onEnrollSuccess,
}: CourseEnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    setLoading(true);
    setError(null);

    try {
      if (accessRule === 'PAYMENT') {
        // Redirect to Stripe checkout for paid courses
        const response = await fetch('/api/payments/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        // Redirect to Stripe checkout using the checkout URL
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      } else {
        // Direct enrollment for open courses
        const response = await fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to enroll');
        }

        onEnrollSuccess?.();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <Button disabled className="w-full">
        Already Enrolled
      </Button>
    );
  }

  const buttonText = accessRule === 'PAYMENT' ? 'Buy Now' : 'Enroll Now';

  return (
    <div className="w-full">
      <Button
        onClick={handleEnroll}
        disabled={loading || accessRule === 'INVITATION'}
        className="w-full"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          buttonText
        )}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {accessRule === 'INVITATION' && (
        <p className="text-gray-500 text-sm mt-2 text-center">
          This course is invitation-only
        </p>
      )}
    </div>
  );
}
