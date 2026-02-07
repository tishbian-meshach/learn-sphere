'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ResendVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Pre-fill email from URL parameter if available
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // Resend verification email using Supabase
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error(error.message || 'Failed to resend verification email');
      } else {
        setEmailSent(true);
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-surface-900">LearnSphere</span>
          </Link>
          <h1 className="text-xl font-bold text-surface-900">Verify Your Email</h1>
          <p className="text-sm text-surface-500 mt-2">
            We need to verify your email address before you can sign in
          </p>
        </div>

        <div className="card shadow-none">
          {!emailSent ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Email Not Verified</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Your account exists, but you haven't verified your email yet. 
                      Please check your inbox for the verification link or request a new one below.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleResendVerification} className="space-y-6">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  hint="Enter the email address you used to sign up"
                  required
                />

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Resend Verification Email
                </Button>
              </form>
            </>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-green-900 mb-2">
                Verification Email Sent!
              </h3>
              <p className="text-sm text-green-700 mb-6">
                We've sent a verification link to <strong>{email}</strong>. 
                Please check your inbox and click the link to verify your email.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/sign-in')}
                  className="w-full"
                >
                  Return to Sign In
                </Button>
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="w-full text-sm text-surface-600 hover:text-surface-900 transition-colors"
                >
                  Didn't receive it? Send again
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border">
            <div className="bg-surface-50 rounded-lg p-4">
              <p className="text-xs text-surface-600 leading-relaxed">
                <strong className="text-surface-900">Note:</strong> If you don't see the email, 
                please check your spam/junk folder. The verification link will expire in 24 hours.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-surface-500">
          Already verified?{' '}
          <Link
            href="/sign-in"
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
