'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Eye, EyeOff, Lock, Mail, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        router.push(redirectTo);
      } else if (profile.role === 'ADMIN' || profile.role === 'INSTRUCTOR') {
        router.push('/admin');
      } else {
        router.push('/learner/courses');
      }
    }
  }, [user, profile, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Signed in successfully');
        // Redirect will happen via auth state change listener in hook
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
          <h1 className="text-xl font-bold text-surface-900">Sign in to your account</h1>
          <p className="text-sm text-surface-500 mt-2">Enter your credentials to access the platform</p>
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
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-surface-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            <div className="flex items-center justify-between">
              <Link
                href="#"
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-border">
            <div className="bg-surface-50 rounded border border-border p-5">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-surface-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-surface-700 uppercase tracking-wider">Demo Accounts</p>
                  <p className="text-[10px] text-surface-500 leading-relaxed font-mono">
                    Admin: admin@learnsphere.com<br />
                    Instructor: instructor@learnsphere.com<br />
                    Learner: learner@learnsphere.com<br />
                    Password: (See README)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-surface-500">
          Don't have an account?{' '}
          <Link
            href="/sign-up"
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
