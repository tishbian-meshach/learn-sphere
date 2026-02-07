'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message);
      } else {
        setEmailSent(true);
        toast.success('Password reset email sent!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
          </div>

          <div className="card shadow-none text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-surface-900 mb-3">Check your email</h1>
            <p className="text-sm text-surface-500 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-xs text-surface-500 mb-8">
              Click the link in the email to reset your password. If you don't see the email, check your spam folder.
            </p>
            <Link href="/sign-in">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
          </div>

          <p className="text-center text-sm text-surface-500">
            Didn't receive the email?{' '}
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-surface-900">Reset your password</h1>
          <p className="text-sm text-surface-500 mt-2">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <div className="card shadow-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-surface-500">
          <Link
            href="/sign-in"
            className="font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
