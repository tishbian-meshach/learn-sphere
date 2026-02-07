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
  X,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabPanel } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { uploadFile } from '@/lib/supabase/storage';
import { compressImage } from '@/lib/image-utils';
import toast from 'react-hot-toast';

interface Lesson {
  id: string;
  title: string;
  type: string;
  orderIndex: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  price: number;
  level: string | null;
  subject: string | null;
  lessons: Lesson[];
  updatedAt: string;
}

export default function CourseEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  // Lesson Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isUploadingLessonAsset, setIsUploadingLessonAsset] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState('lesson-content');
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'VIDEO' as 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'QUIZ',
    description: '',
    responsible: '',
    videoUrl: '',
    duration: '',
    documentUrl: '',
    imageUrl: '',
    allowDownload: false,
    attachments: [] as any[]
  });

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

  const handleOpenEditor = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLessonId(lesson.id);
      // Fetch full lesson details with attachments
      fetch(`/api/courses/${id}/lessons/${lesson.id}`)
        .then(res => res.json())
        .then(data => {
          setLessonForm({
            title: data.title || '',
            type: data.type || 'VIDEO',
            description: data.description || '',
            responsible: data.responsible || '',
            videoUrl: data.videoUrl || '',
            duration: data.duration?.toString() || '',
            documentUrl: data.documentUrl || '',
            imageUrl: data.imageUrl || '',
            allowDownload: data.allowDownload || false,
            attachments: data.attachments || []
          });
        });
    } else {
      setEditingLessonId(null);
      setLessonForm({
        title: '',
        type: 'VIDEO',
        description: '',
        responsible: '',
        videoUrl: '',
        duration: '',
        documentUrl: '',
        imageUrl: '',
        allowDownload: false,
        attachments: []
      });
    }
    setEditorTab('lesson-content');
    setIsEditorOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title) {
      toast.error('Module title required');
      return;
    }

    setIsSavingLesson(true);
    try {
      const url = editingLessonId 
        ? `/api/courses/${id}/lessons/${editingLessonId}`
        : `/api/courses/${id}/lessons`;
      
      const method = editingLessonId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonForm),
      });

      if (res.ok) {
        toast.success(editingLessonId ? 'Module updated' : 'Module initialized');
        setIsEditorOpen(false);
        fetchCourse();
      } else {
        toast.error('Failed to save module');
      }
    } catch (error) {
      toast.error('API communication failure');
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'course' | 'lesson' | 'attachment', attachmentIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Synchronizing artifact...');
    
    try {
      if (type === 'course') setIsUploading(true);
      else setIsUploadingLessonAsset(true);

      const path = `${id}/${type === 'course' ? 'thumbnail' : type === 'lesson' ? 'content' : 'attachment'}/${Date.now()}-${file.name}`;
      
      let fileToUpload: File | Blob = file;
      if (file.type.startsWith('image/')) {
        toast.loading('Optimizing image...', { id: toastId });
        fileToUpload = await compressImage(file);
      }

      const url = await uploadFile(fileToUpload as File, path);

      if (type === 'course') {
        setCourse(c => c ? { ...c, imageUrl: url } : null);
        await handleUpdate({ imageUrl: url });
      } else if (type === 'lesson') {
        const field = lessonForm.type === 'DOCUMENT' ? 'documentUrl' : 'imageUrl';
        setLessonForm(prev => ({ ...prev, [field]: url }));
      } else if (type === 'attachment' && attachmentIndex !== undefined) {
        setLessonForm(prev => {
          const newAttachments = [...prev.attachments];
          newAttachments[attachmentIndex] = { ...newAttachments[attachmentIndex], url };
          return { ...prev, attachments: newAttachments };
        });
      }

      toast.success('Resource synchronized', { id: toastId });
    } catch (error) {
      toast.error('Upload failed', { id: toastId });
    } finally {
      setIsUploading(false);
      setIsUploadingLessonAsset(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('This module and all its metadata will be permanently expunged. Proceed?')) return;

    try {
      const res = await fetch(`/api/courses/${id}/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Module expunged');
        fetchCourse();
      }
    } catch (error) {
      toast.error('Decommissioning failed');
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
                      <Button size="sm" variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenEditor()}>
                        Add Lesson
                      </Button>
                    </div>

                    {(!course.lessons || course.lessons.length === 0) ? (
                      <div className="p-12 text-center rounded border border-dashed border-border bg-slate-50">
                        <p className="text-sm text-surface-500 mb-4">No content modules initialized for this course.</p>
                        <Button size="sm" variant="secondary" onClick={() => handleOpenEditor()}>Add First Module</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[...course.lessons].sort((a,b) => a.orderIndex - b.orderIndex).map((lesson) => (
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
                               <DropdownMenu trigger={<Button variant="ghost" size="icon-sm" className="rounded-full"><SettingsIcon className="w-3.5 h-3.5" /></Button>}>
                                  <DropdownMenuItem onClick={() => handleOpenEditor(lesson)} icon={<FileEdit className="w-3.5 h-3.5" />}>Edit Module</DropdownMenuItem>
                                  <DropdownMenuItem variant="danger" onClick={() => handleDeleteLesson(lesson.id)} icon={<Trash2 className="w-3.5 h-3.5" />}>Decommission</DropdownMenuItem>
                               </DropdownMenu>
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
                         <Input
                            label="Course Subject"
                            value={course.subject || ''}
                            onChange={(e) => setCourse(c => c ? {...c, subject: e.target.value} : null)}
                            placeholder="e.g. Science, Art, Business"
                          />
                          <Select
                            label="Skill Level"
                            value={course.level || ''}
                            onChange={(v) => setCourse(c => c ? {...c, level: v} : null)}
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
                          <Button onClick={() => handleUpdate({ title: course.title, description: course.description, level: course.level, subject: course.subject, price: course.price })} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                             Save Changes
                          </Button>
                       </div>

                       <div className="pt-8 border-t border-border">
                          <div className="flex items-center gap-2 mb-4">
                             <ImageIcon className="w-4 h-4 text-surface-400" />
                             <h4 className="text-sm font-bold text-surface-900">Thumbnail Asset</h4>
                          </div>
                          <div className="flex items-start gap-6 p-4 rounded border border-border bg-slate-50/50">
                             <div className="w-32 aspect-video rounded border border-border bg-white overflow-hidden shrink-0 relative group/thumb">
                                {course.imageUrl ? (
                                  <img src={course.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-surface-200">
                                     <ImageIcon className="w-6 h-6" />
                                  </div>
                                )}
                                {isUploading && (
                                   <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                   </div>
                                )}
                             </div>
                             <div className="flex-1 space-y-3">
                                <p className="text-xs text-surface-500 leading-relaxed">
                                   This image will be displayed in the course catalog and learner dashboard. Optimally 1200x675px (16:9).
                                </p>
                                <div className="flex gap-2">
                                   <input
                                     type="file"
                                     id="details-thumb"
                                     className="hidden"
                                     accept="image/*"
                                     onChange={(e) => handleFileUpload(e, 'course')}
                                   />
                                   <Button asChild variant="outline" size="sm" className="cursor-pointer" isLoading={isUploading}>
                                      <label htmlFor="details-thumb">{course.imageUrl ? 'Update Thumbnail' : 'Upload Thumbnail'}</label>
                                   </Button>
                                   {course.imageUrl && (
                                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleUpdate({ imageUrl: null })}>
                                         Remove
                                      </Button>
                                   )}
                                </div>
                             </div>
                          </div>
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
             <div className="aspect-[4/3] rounded border border-border bg-white flex items-center justify-center overflow-hidden mb-3 relative group/img">
                {course.imageUrl ? (
                  <img src={course.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-surface-200" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
             </div>
             <div className="relative">
                <input
                  type="file"
                  id="course-image"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'course')}
                />
                <Button 
                  asChild
                  variant="outline" 
                  size="sm" 
                  className="w-full cursor-pointer"
                  isLoading={isUploading}
                >
                  <label htmlFor="course-image">
                    {course.imageUrl ? 'Update Cover Image' : 'Select Cover Image'}
                  </label>
                </Button>
             </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingLessonId ? "Modify Infrastructure" : "Initialize Module"}
        description={editingLessonId ? "Update technical specifications for this unit." : "Append a new curriculum unit to this course registry."}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveLesson} isLoading={isSavingLesson}>Save Module</Button>
          </>
        }
      >
        <div className="space-y-6">
          <Tabs 
            tabs={[
              { id: 'lesson-content', label: 'Core Content', icon: <Layout className="w-3.5 h-3.5" /> },
              { id: 'lesson-desc', label: 'Exposition', icon: <FileText className="w-3.5 h-3.5" /> },
              { id: 'lesson-attach', label: 'Supplementary', icon: <Plus className="w-3.5 h-3.5" /> },
            ]} 
            activeTab={editorTab} 
            onChange={setEditorTab} 
          />

          <div className="min-h-[300px]">
             <TabPanel isActive={editorTab === 'lesson-content'}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Unit Title"
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Masterclass Introduction"
                    />
                    <Select
                      label="Delivery Format"
                      value={lessonForm.type}
                      onChange={(v) => setLessonForm(prev => ({ ...prev, type: v as any }))}
                      options={[
                        { value: 'VIDEO', label: 'Immersive Video' },
                        { value: 'DOCUMENT', label: 'Technical Guide' },
                        { value: 'IMAGE', label: 'Visual Reference' },
                        { value: 'QUIZ', label: 'Certification Quiz' },
                      ]}
                    />
                  </div>
                  
                  <Input
                    label="Stakeholder/Responsible (Optional)"
                    value={lessonForm.responsible || ''}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, responsible: e.target.value }))}
                    placeholder="Instructor or Dept Name"
                  />

                  {lessonForm.type === 'VIDEO' && (
                    <div className="grid grid-cols-3 gap-4 p-4 rounded bg-slate-50 border border-border">
                       <div className="col-span-2">
                          <Input
                            label="Streaming URL (YouTube/Drive)"
                            value={lessonForm.videoUrl || ''}
                            onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                          />
                       </div>
                       <Input
                         label="Duration (Min)"
                         type="number"
                         value={lessonForm.duration || ''}
                         onChange={(e) => setLessonForm(prev => ({ ...prev, duration: e.target.value }))}
                       />
                    </div>
                  )}

                  {(lessonForm.type === 'DOCUMENT' || lessonForm.type === 'IMAGE') && (
                    <div className="space-y-4 p-4 rounded bg-slate-50 border border-border">
                       <div className="space-y-2">
                          <label className="text-xs font-semibold text-surface-700 uppercase tracking-wider">
                             Resource Asset
                          </label>
                          <div className="flex gap-2">
                             <Input
                               placeholder={lessonForm.type === 'DOCUMENT' ? 'Document URL' : 'Image URL'}
                               value={lessonForm.type === 'DOCUMENT' ? lessonForm.documentUrl || '' : lessonForm.imageUrl || ''}
                               onChange={(e) => setLessonForm(prev => ({ ...prev, [lessonForm.type === 'DOCUMENT' ? 'documentUrl' : 'imageUrl']: e.target.value }))}
                             />
                             <div className="relative shrink-0">
                                <input
                                  type="file"
                                  id="lesson-asset"
                                  className="hidden"
                                  accept={lessonForm.type === 'DOCUMENT' ? '.pdf,.doc,.docx,.epub' : 'image/*'}
                                  onChange={(e) => handleFileUpload(e, 'lesson')}
                                />
                                <Button asChild variant="secondary" size="icon" className="cursor-pointer" isLoading={isUploadingLessonAsset}>
                                   <label htmlFor="lesson-asset">
                                      {isUploadingLessonAsset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                   </label>
                                </Button>
                             </div>
                          </div>
                       </div>
                       <Toggle
                         label="Allow Repository Download"
                         description="Enable learners to archive this resource locally."
                         checked={lessonForm.allowDownload}
                         onChange={(v) => setLessonForm(prev => ({ ...prev, allowDownload: v }))}
                       />
                    </div>
                  )}
                </div>
             </TabPanel>

             <TabPanel isActive={editorTab === 'lesson-desc'}>
                <Textarea
                  label="Unit Exposition"
                  value={lessonForm.description || ''}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={8}
                  placeholder="Provide technical context and learning objectives for this module..."
                />
             </TabPanel>

             <TabPanel isActive={editorTab === 'lesson-attach'}>
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest">Resource Registry</p>
                                             <Button variant="outline" size="sm" leftIcon={<Plus className="w-3 h-3" />} onClick={() => {
                         setLessonForm(p => ({ 
                           ...p, 
                           attachments: [...p.attachments, { name: '', url: '', isExternal: true }] 
                         }));
                       }}>Add Resource</Button>
                   </div>
                   
                   <div className="space-y-2">
                      {lessonForm.attachments.length === 0 ? (
                        <div className="py-8 text-center border-2 border-dashed border-border rounded">
                           <p className="text-xs text-surface-400">No supplementary artifacts attached.</p>
                        </div>
                      ) : (
                        lessonForm.attachments.map((a, i) => (
                          <div key={i} className="flex flex-col gap-2 p-3 rounded border border-border bg-white shadow-sm group/attach">
                                                           <div className="flex items-center justify-between gap-4">
                                 <Input
                                   value={a.name}
                                   onChange={(e) => {
                                     const next = [...lessonForm.attachments];
                                     next[i].name = e.target.value;
                                     setLessonForm(p => ({ ...p, attachments: next }));
                                   }}
                                   placeholder="Resource Label (e.g. Cheat Sheet)"
                                   className="h-8 text-xs font-bold bg-slate-50 border-none focus:ring-0"
                                 />
                                 <Button variant="ghost" size="icon-sm" className="text-destructive rounded-full shrink-0" onClick={() => {
                                   setLessonForm(p => ({ ...p, attachments: p.attachments.filter((_, idx) => idx !== i) }));
                                 }}>
                                    <X className="w-3 h-3" />
                                 </Button>
                              </div>
                             <div className="flex gap-2">
                                <Input
                                  value={a.url}
                                  onChange={(e) => {
                                    const next = [...lessonForm.attachments];
                                    next[i].url = e.target.value;
                                    setLessonForm(p => ({ ...p, attachments: next }));
                                  }}
                                  placeholder="Resource URL"
                                  className="h-8 text-xs"
                                />
                                <div className="relative">
                                   <input
                                     type="file"
                                     id={`attach-${i}`}
                                     className="hidden"
                                     onChange={(e) => handleFileUpload(e, 'attachment', i)}
                                   />
                                   <Button asChild variant="ghost" size="icon-sm" className="h-8 w-8 cursor-pointer">
                                      <label htmlFor={`attach-${i}`}>
                                         <Plus className="w-3.5 h-3.5" />
                                      </label>
                                   </Button>
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             </TabPanel>
          </div>
        </div>
      </Modal>
    </div>
  );
}
