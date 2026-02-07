'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, PlayCircle, ArrowRight, Trophy, Compass, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  startedAt: string | null;
  course: {
    id: string;
    title: string;
    imageUrl: string | null;
    tags: { id: string; name: string }[];
    lessons: { id: string }[];
    instructor: { id: string; name: string | null };
  };
}

export default function MyCoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      const res = await fetch(`/api/enrollments?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data);
      }
    } catch (error) {
      toast.error('Failed to sync learning sessions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Active Learning</h1>
          <p className="text-sm text-surface-500">Continuous progress monitoring for your enrolled programs.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/learner/courses')} leftIcon={<Compass className="w-4 h-4" />}>
          Search Library
        </Button>
      </div>

      {/* Stats Board */}
      {enrollments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 flex flex-col border-border shadow-none bg-white">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider">Enrolled Programs</span>
                <BookOpen className="w-4 h-4 text-primary" />
             </div>
             <p className="text-2xl font-extrabold text-surface-900">{enrollments.length}</p>
          </div>
          <div className="card p-4 flex flex-col border-border shadow-none bg-white">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider">Active Sessions</span>
                <Activity className="w-4 h-4 text-amber-500" />
             </div>
             <p className="text-2xl font-extrabold text-surface-900">
                {enrollments.filter((e) => e.status === 'ACTIVE' && e.startedAt).length}
             </p>
          </div>
          <div className="card p-4 flex flex-col border-border shadow-none bg-white">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider">Completed Tracks</span>
                <Trophy className="w-4 h-4 text-emerald-500" />
             </div>
             <p className="text-2xl font-extrabold text-surface-900">
                {enrollments.filter((e) => e.status === 'COMPLETED').length}
             </p>
          </div>
        </div>
      )}

      {/* Course List - List View for professional feel */}
      <div className="space-y-4">
        <h2 className="text-xs font-extrabold text-surface-400 uppercase tracking-wider">Subscription Repository</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : enrollments.length === 0 ? (
          <EmptyState
            title="Registry Empty"
            description="You have not enrolled in any professional learning tracks yet."
            action={{ label: 'Explore Catalog', onClick: () => router.push('/learner/courses') }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="card group p-5 flex flex-col hover:border-primary/20 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                   <div className="w-10 h-10 rounded border border-border bg-surface-50 flex items-center justify-center flex-shrink-0">
                      {enrollment.course.imageUrl ? (
                        <img src={enrollment.course.imageUrl} className="w-full h-full object-cover rounded shadow-none" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-surface-300" />
                      )}
                   </div>
                   <Badge variant={enrollment.status === 'COMPLETED' ? 'success' : 'primary'} size="sm">
                      {enrollment.status}
                   </Badge>
                </div>

                <div className="flex-1 space-y-4">
                   <div>
                      <h3 className="text-sm font-extrabold text-surface-900 line-clamp-1 group-hover:text-primary transition-colors">
                        {enrollment.course.title}
                      </h3>
                      <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest mt-1">
                        By {enrollment.course.instructor.name || 'Staff Instructor'}
                      </p>
                   </div>

                   <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-extrabold text-surface-500 uppercase tracking-wider">
                         <span>Completion Progress</span>
                         <span>{Math.round(enrollment.progress)}%</span>
                      </div>
                      <Progress value={enrollment.progress} size="sm" />
                   </div>

                   <Button
                      variant={enrollment.status === 'COMPLETED' ? 'outline' : 'primary'}
                      className="w-full"
                      size="sm"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={() => router.push(`/learn/${enrollment.course.id}`)}
                   >
                      {enrollment.status === 'COMPLETED' ? 'Registry Archive' : 'Resume Session'}
                   </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
