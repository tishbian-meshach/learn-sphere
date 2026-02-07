'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Shield,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, user, profile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'LEARNER' | 'INSTRUCTOR'>('LEARNER');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'INSTRUCTOR') {
        router.push('/admin');
      } else {
        router.push('/learner/courses');
      }
    }
  }, [user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, name, role);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created! Please check your email.');
        router.push('/sign-in');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-surface-900">LearnSphere</span>
          </Link>
          <h1 className="text-xl font-bold text-surface-900">Create your account</h1>
          <p className="text-sm text-surface-500 mt-2">Join LearnSphere today and start your journey</p>
        </div>

        <div className="card shadow-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('LEARNER')}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-md border text-center transition-all',
                  role === 'LEARNER'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-white hover:border-surface-300'
                )}
              >
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', role === 'LEARNER' ? 'bg-primary text-white' : 'bg-surface-100 text-surface-500')}>
                  <User className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-surface-400">Join as</p>
                  <p className="text-sm font-bold text-surface-900 leading-tight">Learner</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole('INSTRUCTOR')}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-md border text-center transition-all',
                  role === 'INSTRUCTOR'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-white hover:border-surface-300'
                )}
              >
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', role === 'INSTRUCTOR' ? 'bg-primary text-white' : 'bg-surface-100 text-surface-500')}>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-surface-400">Join as</p>
                  <p className="text-sm font-bold text-surface-900 leading-tight">Instructor</p>
                </div>
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
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
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-surface-500">
          Already have an account?{' '}
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
