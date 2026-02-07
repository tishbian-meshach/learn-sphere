'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  BookOpen,
  Users,
  Clock,
  Eye,
  FileEdit,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { CardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { cn, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  visibility: string;
  level: string | null;
  price: number | null;
  subject: string | null;
  _count: {
    lessons: number;
    enrollments: number;
    reviews: number;
  };
  updatedAt: string;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseTitle) return;
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCourseTitle, instructorId: user?.id }),
      });
      if (res.ok) {
        const course = await res.json();
        toast.success('Course created');
        router.push(`/admin/courses/${course.id}`);
      }
    } catch (error) {
      toast.error('Failed to create course');
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || c.level === selectedLevel;
    const matchesPrice = selectedPrice === 'all' || (
      selectedPrice === 'FREE' ? (c.price === 0 || c.price === null) : (c.price !== null && c.price > 0)
    );
    const matchesSubject = selectedSubject === 'all' || c.subject === selectedSubject;

    return matchesSearch && matchesLevel && matchesPrice && matchesSubject;
  });

  const uniqueSubjects = Array.from(new Set(courses.map(c => c.subject).filter(Boolean))) as string[];

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success" size="sm" className="font-bold">Published</Badge>;
      case 'DRAFT':
        return <Badge variant="default" size="sm" className="font-bold">Draft</Badge>;
      case 'ARCHIVED':
        return <Badge variant="error" size="sm" className="font-bold">Archived</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Management</h1>
          <p className="text-sm text-surface-500">Inventory and lifecycle management of your courses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateModalOpen(true)}>
            New Course
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
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

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search by course title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="bg-white"
          />
        </div>
        <div className="flex items-center gap-2 ml-4">
          {(selectedLevel !== 'all' || selectedPrice !== 'all' || selectedSubject !== 'all' || searchQuery !== '') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedLevel('all');
                setSelectedPrice('all');
                setSelectedSubject('all');
                setSearchQuery('');
              }}
              className="text-surface-500 hover:text-primary"
            >
              Clear All
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-md ml-4">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('grid')}
            className={cn("h-7 w-7", view === 'grid' && "bg-white shadow-sm")}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('list')}
            className={cn("h-7 w-7", view === 'list' && "bg-white shadow-sm")}
          >
            <ListIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Try adjusting your search or create your first course."
          action={{ label: 'Create Course', onClick: () => setIsCreateModalOpen(true) }}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="card group flex flex-col p-0 overflow-hidden hover:border-primary/20 transition-all duration-300">
              <div className="aspect-[16/9] bg-surface-50 relative overflow-hidden flex items-center justify-center border-b border-border">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-12 h-12 text-surface-200" />
                )}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu trigger={<Button variant="secondary" size="icon-sm" className="bg-white/90 backdrop-blur-sm shadow-sm"><MoreVertical className="w-4 h-4" /></Button>}>
                    <DropdownMenuItem onClick={() => router.push(`/admin/courses/${course.id}`)}>
                      <FileEdit className="w-4 h-4 mr-2" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/courses/${course.id}`, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenu>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={course.status} />
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center gap-1">
                    ID: {course.id.slice(0, 8)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-surface-900 line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-surface-500 font-medium">
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 opacity-60" /> {course._count?.enrollments ?? 0}</span>
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 opacity-60" /> {course._count?.lessons ?? 0} lessons</span>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/admin/courses/${course.id}`)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-md overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Resource</th>
                <th className="px-6 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Metrics</th>
                <th className="px-6 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Updated</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded border border-border bg-surface-50 flex items-center justify-center flex-shrink-0">
                        {course.imageUrl ? (
                          <img src={course.imageUrl} className="w-full h-full object-cover rounded" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-surface-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-surface-900 truncate group-hover:text-primary transition-colors cursor-pointer" onClick={() => router.push(`/admin/courses/${course.id}`)}>{course.title}</p>
                        <p className="text-[10px] text-surface-400 font-mono">{course.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={course.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-xs text-surface-600 font-medium">
                      <span title="Learners">{course._count?.enrollments ?? 0} users</span>
                      <span title="Content">{course._count?.lessons ?? 0} units</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-surface-500 font-medium">
                    {new Date(course.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/admin/courses/${course.id}`)}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initialize New Course"
        description="Enter a title to begin the course creation process. You can update this later."
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCourse}>Initialize Course</Button>
          </div>
        }
      >
        <Input
          label="Internal Title"
          placeholder="e.g. Advanced System Architecture"
          value={newCourseTitle}
          onChange={(e) => setNewCourseTitle(e.target.value)}
          autoFocus
        />
      </Modal>
    </div>
  );
}
