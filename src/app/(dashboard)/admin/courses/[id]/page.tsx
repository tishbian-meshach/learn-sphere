'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  BookOpen,
  Video,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Eye,
  Settings as SettingsIcon,
  Layout,
  Globe,
  Lock,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  FileEdit,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabPanel } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Lesson {
  id: string;
  title: string;
  type: string;
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  price: number;
  level: string;
  lessons: Lesson[];
  updatedAt: string;
}

export default function CourseEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
      }
    } catch (error) {
      toast.error('Failed to load course details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (updates: Partial<Course>) => {
    if (!course) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setCourse(updated);
        toast.success('Changes synchronized');
      }
    } catch (error) {
      toast.error('Synchronization failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) return null;

  const tabs = [
    { id: 'content', label: 'Curriculum', icon: <Layout className="w-4 h-4" /> },
    { id: 'details', label: 'Publication info', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'settings', label: 'Infrastructure', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon-sm" onClick={() => router.push('/admin/courses')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-surface-900 tracking-tight">
                {course.title}
              </h1>
              <Badge variant={course.status === 'PUBLISHED' ? 'success' : 'default'} size="sm">
                {course.status}
              </Badge>
            </div>
            <p className="text-xs text-surface-500 font-mono">{course.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/learn/${course.id}`} target="_blank">
               Preview <ArrowUpRight className="ml-2 w-3.5 h-3.5" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant={course.status === 'PUBLISHED' ? 'outline' : 'primary'}
            onClick={() => handleUpdate({ status: course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })}
            isLoading={isSaving}
          >
            {course.status === 'PUBLISHED' ? 'Revert to Draft' : 'Publish Resource'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-md overflow-hidden">
             <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="px-4" />
             
             <div className="p-6">
                <TabPanel isActive={activeTab === 'content'}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                        <Layout className="w-4 h-4" /> Modules & Units
                      </h3>
                      <Button size="sm" variant="outline" leftIcon={<Plus className="w-4 h-4" />}>
                        Add Lesson
                      </Button>
                    </div>

                    {course.lessons.length === 0 ? (
                      <div className="p-12 text-center rounded border border-dashed border-border bg-slate-50">
                        <p className="text-sm text-surface-500 mb-4">No content modules initialized for this course.</p>
                        <Button size="sm" variant="secondary">Add First Module</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[...course.lessons].sort((a,b) => a.order - b.order).map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-3 p-3 bg-white border border-border rounded-md hover:border-surface-300 transition-all group">
                            <div className="cursor-grab text-surface-300 group-hover:text-surface-500">
                               <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="w-8 h-8 rounded bg-surface-50 border border-border flex items-center justify-center">
                               {lesson.type === 'VIDEO' && <Video className="w-4 h-4 text-primary" />}
                               {lesson.type === 'DOCUMENT' && <FileText className="w-4 h-4 text-primary" />}
                               {lesson.type === 'IMAGE' && <ImageIcon className="w-4 h-4 text-primary" />}
                               {lesson.type === 'QUIZ' && <HelpCircle className="w-4 h-4 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-semibold text-surface-900 truncate">{lesson.title}</p>
                               <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest">{lesson.type}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button variant="ghost" size="icon-sm"><FileEdit className="w-3.5 h-3.5 text-surface-500" /></Button>
                               <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabPanel>

                <TabPanel isActive={activeTab === 'details'}>
                   <div className="space-y-6 max-w-2xl">
                      <Input
                        label="Published Title"
                        value={course.title}
                        onChange={(e) => setCourse(c => c ? {...c, title: e.target.value} : null)}
                        hint="The title visible to your learners."
                      />
                      <Textarea
                        label="Course Summary"
                        value={course.description || ''}
                        onChange={(e) => setCourse(c => c ? {...c, description: e.target.value} : null)}
                        rows={6}
                        hint="A concise breakdown of the course objectives and curriculum."
                      />
                      <div className="grid grid-cols-2 gap-4">
                         <Select
                           label="Subject Level"
                           value={course.level}
                           onChange={(v) => handleUpdate({ level: v })}
                           options={[
                             { value: 'BEGINNER', label: 'Beginner (Standard)' },
                             { value: 'INTERMEDIATE', label: 'Intermediate (Advanced)' },
                             { value: 'ADVANCED', label: 'Advanced (Expert)' },
                           ]}
                         />
                         <Input
                           label="Enrollment Fee (₹)"
                           leftIcon={<span className="text-surface-400 font-bold">₹</span>}
                           type="number"
                           value={course.price}
                           onChange={(e) => setCourse(c => c ? {...c, price: Number(e.target.value)} : null)}
                           placeholder="0 for free courses"
                         />
                      </div>
                      <div className="pt-4 border-t border-border flex justify-end">
                         <Button onClick={() => handleUpdate({ title: course.title, description: course.description, level: course.level, price: course.price })} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                            Save Changes
                         </Button>
                      </div>
                   </div>
                </TabPanel>

                <TabPanel isActive={activeTab === 'settings'}>
                   <div className="space-y-8 max-w-2xl">
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-surface-500" />
                            <h4 className="text-sm font-bold text-surface-900">Access Governance</h4>
                         </div>
                         <div className="space-y-4 p-4 rounded border border-border bg-slate-50/50">
                            <Toggle
                              label="Public Visibility"
                              description="Make this course visible to all users in the public catalog."
                              checked={course.visibility === 'PUBLIC'}
                              onChange={(v) => handleUpdate({ visibility: v ? 'PUBLIC' : 'PRIVATE' })}
                            />
                            <div className="h-[1px] bg-border" />
                            <div className="flex items-center justify-between gap-4">
                               <div>
                                  <p className="text-sm font-bold text-surface-900">Internal UUID</p>
                                  <p className="text-xs text-surface-500">Reference identifier for API and database operations.</p>
                                </div>
                               <code className="text-[10px] bg-white border border-border px-1.5 py-0.5 rounded">{course.id}</code>
                            </div>
                         </div>
                      </div>

                      <div className="p-4 bg-amber-50 rounded border border-amber-200 flex gap-3">
                         <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                         <div>
                            <p className="text-sm font-bold text-amber-900">Platform Restrictions</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                               Deleting or archiving a course will immediately restrict access for all enrolled learners. This action is recorded in the organization log.
                            </p>
                         </div>
                      </div>

                      <div className="pt-4 border-t border-border flex justify-end">
                         <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
                            Terminate Course Resource
                         </Button>
                      </div>
                   </div>
                </TabPanel>
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card shadow-none p-5">
            <h4 className="text-xs font-extrabold text-surface-400 uppercase tracking-wider mb-4">Resource Info</h4>
            <div className="space-y-4">
               <div>
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest leading-none mb-1.5">Last Synchronized</p>
                  <p className="text-xs font-medium text-surface-700">{new Date(course.updatedAt).toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest leading-none mb-1.5">Owner / Provider</p>
                  <p className="text-xs font-medium text-surface-700">Self (Administrator)</p>
               </div>
               <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-primary">
                     <Users className="w-3.5 h-3.5" />
                     <span className="text-xs font-bold">14 Active Enrollments</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="card shadow-none p-5 border-dashed bg-slate-50">
             <div className="aspect-[4/3] rounded border border-border bg-white flex items-center justify-center overflow-hidden mb-3">
                {course.imageUrl ? (
                  <img src={course.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-surface-200" />
                )}
             </div>
             <Button variant="outline" size="sm" className="w-full">
                Change Cover Image
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
