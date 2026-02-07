'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  Clock,
  Star,
  Users,
  ChevronRight,
  Filter,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { cn, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  instructor: { id: string; name: string | null };
  price: number;
  level: string;
  _count: {
    lessons: number;
    enrollments: number;
    reviews: number;
  };
  rating: number;
}

export default function BrowseCoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses?status=PUBLISHED');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      toast.error('Failed to fetch catalog');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-screen-xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight flex items-center gap-2">
             <GraduationCap className="w-6 h-6 text-primary" /> Learning Center
          </h1>
          <p className="text-sm text-surface-500">Professional certification courses and skill development modules.</p>
        </div>
      </div>

      {/* Filter Bar - Minimal */}
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="flex-1 max-w-sm">
           <Input
             placeholder="Search by keyword, subject, or provider..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             leftIcon={<Search className="w-4 h-4" />}
             className="bg-white shadow-none"
           />
        </div>
        <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
           Course Tracks
        </Button>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          title="No resources found"
          description="Refine your search parameters or check back later for new course releases."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="card group flex flex-col p-4 hover:border-primary/20 transition-all duration-300">
               <div className="aspect-video bg-surface-50 border border-border rounded overflow-hidden relative mb-4">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <BookOpen className="w-10 h-10 text-surface-200" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" size="sm" className="bg-white/90 shadow-sm backdrop-blur-sm px-1.5">{course.level}</Badge>
                  </div>
               </div>

               <div className="flex-1 flex flex-col">
                  <h3 className="text-sm font-extrabold text-surface-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-tight">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-4">
                    <span>{course.instructor.name || 'Staff Instructor'}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{course._count?.lessons ?? 0} Modules</span>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                       <div className="flex items-center gap-1.5 text-surface-500">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold">{course.rating || '5.0'}</span>
                          <span className="text-[10px]">({course._count?.enrollments ?? 0})</span>
                       </div>
                       {(course.price === null || course.price === 0) ? (
                         <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                           Free
                         </span>
                       ) : (
                         <div className="flex items-baseline gap-0.5">
                           <span className="text-[10px] font-bold text-surface-400">₹</span>
                           <span className="text-lg font-extrabold text-surface-900 tracking-tight">{Math.floor(course.price)}</span>
                         </div>
                       )}
                    </div>

                    <Button className="w-full" size="sm" onClick={() => router.push(`/learn/${course.id}`)} rightIcon={<ChevronRight className="w-4 h-4" />}>
                       Enroll Now
                    </Button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
