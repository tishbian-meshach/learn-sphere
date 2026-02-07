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
  CheckCircle,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { CourseEnrollButton } from '@/components/shared/CourseEnrollButton';
import { Certificate } from '@/components/shared/Certificate';
import { useAuth } from '@/hooks/use-auth';
import { cn, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  instructor: { id: string; name: string | null };
  price: number | null;
  accessRule: 'OPEN' | 'INVITATION' | 'PAYMENT';
  level: string | null;
  subject: string | null;
  _count: {
    lessons: number;
    enrollments: number;
    reviews: number;
  };
  tags: { id: string; name: string }[];
  averageRating: number;
  userStatus?: {
    enrolled: boolean;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
    progress: number;
  };
}

export default function BrowseCoursesPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<{ courseId: string; title: string } | null>(null);

  useEffect(() => {
    if (user?.id) fetchCourses();
  }, [user?.id]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/courses?published=true&visibility=EVERYONE&userId=${user?.id}`);
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

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags');
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || c.level === selectedLevel;
    const matchesPrice = selectedPrice === 'all' || (
      selectedPrice === 'FREE' ? (c.price === 0 || c.price === null) : (c.price !== null && c.price > 0)
    );
    const matchesSubject = selectedSubject === 'all' || c.subject === selectedSubject;
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag =>
      c.tags.some(t => t.name === tag)
    );

    return matchesSearch && matchesLevel && matchesPrice && matchesSubject && matchesTags;
  });

  const uniqueSubjects = Array.from(new Set(courses.map(c => c.subject).filter(Boolean))) as string[];

  const getCourseButton = (course: Course) => {
    if (course.userStatus?.status === 'COMPLETED' || course.userStatus?.progress === 100) {
      return (
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            size="sm"
            onClick={() => router.push(`/learn/${course.id}`)}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Completed
          </Button>
          <Button
            variant="primary"
            className="px-3"
            size="sm"
            onClick={() => setSelectedCertificate({ courseId: course.id, title: course.title })}
            title="View Certificate"
          >
            <Award className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    if (course.userStatus?.enrolled) {
      return (
        <Button
          className="w-full"
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/learn/${course.id}`)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Resume Course
        </Button>
      );
    }

    return (
      <CourseEnrollButton
        courseId={course.id}
        accessRule={course.accessRule}
        price={course.price ? Number(course.price) : undefined}
        isEnrolled={false}
        onEnrollSuccess={() => {
          fetchCourses();
          router.push(`/learn/${course.id}`);
        }}
      />
    );
  };
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

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search by keyword, subject, or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="bg-white shadow-none"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          {(selectedLevel !== 'all' || selectedPrice !== 'all' || selectedSubject !== 'all' || searchQuery !== '') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedLevel('all');
                setSelectedPrice('all');
                setSelectedSubject('all');
                setSelectedTags([]);
                setSearchQuery('');
              }}
              className="text-surface-500 hover:text-primary"
            >
              Clear All
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-surface-50 border border-border rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <Select
              label="Filter by Level"
              value={selectedLevel}
              onChange={setSelectedLevel}
              options={[
                { label: 'All Levels', value: 'all' },
                { label: 'Beginner', value: 'BEGINNER' },
                { label: 'Intermediate', value: 'INTERMEDIATE' },
                { label: 'Advanced', value: 'ADVANCED' },
              ]}
            />
            <Select
              label="Filter by Price"
              value={selectedPrice}
              onChange={setSelectedPrice}
              options={[
                { label: 'All Prices', value: 'all' },
                { label: 'Free', value: 'FREE' },
                { label: 'Paid', value: 'PAID' },
              ]}
            />
            <Select
              label="Filter by Subject"
              value={selectedSubject}
              onChange={setSelectedSubject}
              options={[
                { label: 'All Subjects', value: 'all' },
                ...uniqueSubjects.map(subject => ({ label: subject, value: subject }))
              ]}
              searchable
            />
          </div>
        )}

        {showFilters && availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in duration-500">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest self-center mr-2">Filter by Tag:</p>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                  );
                }}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border",
                  selectedTags.includes(tag)
                    ? "bg-primary border-primary text-white shadow-sm scale-105"
                    : "bg-white border-border text-surface-500 hover:border-primary/30"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
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
                {course.level && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" size="sm" className="bg-white/90 shadow-sm backdrop-blur-sm px-1.5">{course.level}</Badge>
                  </div>
                )}
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

                <div className="flex flex-wrap gap-1 mb-4">
                  {course.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="px-1.5 py-0.5 rounded bg-surface-50 border border-border text-[9px] font-bold text-surface-500 group-hover:bg-white transition-colors"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {course.tags.length > 3 && (
                    <span className="text-[9px] font-bold text-surface-400 self-center">+{course.tags.length - 3} more</span>
                  )}
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5 text-surface-500">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold">{course.averageRating > 0 ? course.averageRating : 'New'}</span>
                      <span className="text-[10px]">({course._count?.reviews ?? 0})</span>
                    </div>
                    {course.price === null || course.price === 0 ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                        Free
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[10px] font-bold text-surface-400">₹</span>
                        <span className="text-lg font-extrabold text-surface-900 tracking-tight">
                          {Math.floor(course.price)}
                        </span>
                      </div>
                    )}
                  </div>

                  {getCourseButton(course)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Certificate Overlay */}
      {selectedCertificate && user && (
        <Certificate
          userName={profile?.name || 'Distinguished Practitioner'}
          courseTitle={selectedCertificate.title}
          completionDate={new Date().toISOString()} // In a real app, this should come from enrollment data
          certificateId={`CRT-${selectedCertificate.courseId.slice(-6).toUpperCase()}-${user.id.slice(-6).toUpperCase()}`}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
}
