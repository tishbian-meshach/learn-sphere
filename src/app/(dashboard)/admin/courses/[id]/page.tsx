'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
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
  Trophy,
  MessageSquare,
  UserPlus,
  Mail,
  Copy,
  ExternalLink as ExternalLinkIcon,
  AlertTriangle,
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { uploadFile } from '@/lib/supabase/storage';
import { compressImage } from '@/lib/image-utils';
import { QuizBuilder } from '@/components/admin/QuizBuilder';
import { CourseReviews } from '@/components/shared/CourseReviews';
import { Avatar } from '@/components/ui/avatar';
import toast from 'react-hot-toast';

interface Attendee {
  id: string;
  status: string;
  enrolledAt: string;
  progress: number;
  timeSpent: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    badgeLevel: string;
    totalPoints: number;
    lessonProgress: {
      timeSpent: number;
      isCompleted: boolean;
      lesson: { title: string };
    }[];
  };
}

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
  isPublished: boolean;
  visibility: 'EVERYONE' | 'SIGNED_IN';
  price: number;
  level: string | null;
  subject: string | null;
  lessons: Lesson[];
  updatedAt: string;
  enrollmentsCount?: number;
  instructor?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    email: string;
  };
  tags: { id: string; name: string }[];
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
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isAttendeesLoading, setIsAttendeesLoading] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [isTimeBreakdownOpen, setIsTimeBreakdownOpen] = useState(false);

  // Delete State
  const [isDeleteLessonDialogOpen, setIsDeleteLessonDialogOpen] = useState(false);
  const [lessonToDeleteId, setLessonToDeleteId] = useState<string | null>(null);
  const [isDeleteQuizDialogOpen, setIsDeleteQuizDialogOpen] = useState(false);
  const [quizToDeleteId, setQuizToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatTime = (seconds: number) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };
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
      } else if (res.status === 403) {
        toast.error('Unauthorized. You can only view your own courses.');
        router.push('/admin/courses');
      } else {
        toast.error('Failed to load course details');
      }
    } catch (error) {
      toast.error('Failed to load course details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await fetch(`/api/courses/${id}/quizzes`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Failed to load quizzes');
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
      console.error('Failed to load tags');
    }
  };

  const fetchAttendees = async () => {
    setIsAttendeesLoading(true);
    try {
      const res = await fetch(`/api/courses/${id}/attendees`);
      if (res.ok) {
        const data = await res.json();
        setAttendees(data);
      }
    } catch (error) {
      console.error('Failed to load attendees');
    } finally {
      setIsAttendeesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'quizzes') fetchQuizzes();
    if (activeTab === 'details') fetchTags();
    if (activeTab === 'attendees') fetchAttendees();
  }, [activeTab]);

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
      } else if (res.status === 403) {
        toast.error('Unauthorized. You can only edit your own courses.');
      } else {
        toast.error('Synchronization failed');
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

  const handleCreateQuiz = async () => {
    const toastId = toast.loading('Initializing assessment unit...');
    try {
      const res = await fetch(`/api/courses/${id}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Assessment',
          orderIndex: course?.lessons.length || 0
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Assessment unit initialized', { id: toastId });
        fetchQuizzes();
        fetchCourse();
        setActiveQuizId(data.id);
        setIsQuizBuilderOpen(true);
      }
    } catch (error) {
      toast.error('Initialization failed', { id: toastId });
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizToDeleteId(quizId);
    setIsDeleteQuizDialogOpen(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDeleteId) return;
    setIsDeleting(true);
    const toastId = toast.loading('Decommissioning assessment...');
    try {
      const res = await fetch(`/api/quizzes/${quizToDeleteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Assessment decommissioned', { id: toastId });
        fetchQuizzes();
        fetchCourse();
        setIsDeleteQuizDialogOpen(false);
      } else {
        toast.error('Decommissioning failed', { id: toastId });
      }
    } catch (error) {
      toast.error('Decommissioning failed', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenQuizBuilderForLesson = async (lessonId: string) => {
    try {
      const res = await fetch(`/api/quizzes/by-lesson/${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveQuizId(data.id);
        setIsQuizBuilderOpen(true);
      } else {
        toast.error('No assessment logic found for this unit');
      }
    } catch (error) {
      toast.error('Failed to initialize builder');
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessonToDeleteId(lessonId);
    setIsDeleteLessonDialogOpen(true);
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDeleteId) return;
    setIsDeleting(true);
    const toastId = toast.loading('Expunging module...');
    try {
      const res = await fetch(`/api/courses/${id}/lessons/${lessonToDeleteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Module expunged', { id: toastId });
        fetchCourse();
        setIsDeleteLessonDialogOpen(false);
      } else {
        toast.error('Expunging failed', { id: toastId });
      }
    } catch (error) {
      toast.error('Decommissioning failed', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !course) return;

    const items = Array.from(course.lessons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update locally first
    const updatedLessons = items.map((item, index) => ({
      ...item,
      orderIndex: index,
    }));

    setCourse({ ...course, lessons: updatedLessons });

    // Sync with backend
    try {
      const res = await fetch(`/api/courses/${id}/lessons`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessons: updatedLessons.map(l => ({ id: l.id, orderIndex: l.orderIndex }))
        }),
      });

      if (!res.ok) {
        toast.error('Failed to preserve curriculum order');
        fetchCourse(); // Revert on failure
      }
    } catch (error) {
      toast.error('Reordering synchronization failed');
      fetchCourse();
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Email address required');
      return;
    }

    if (!course?.isPublished) {
      toast.error('Automated invitations are restricted to published courses only.');
      return;
    }

    const toastId = toast.loading('Sending automated invitation...');
    try {
      const res = await fetch(`/api/courses/${id}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (res.ok) {
        toast.success(`Invitation successfully dispatched to ${inviteEmail}`, { id: toastId });
        setIsInviteModalOpen(false);
        setInviteEmail('');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Automated dispatch failure', { id: toastId });
      }
    } catch (error) {
      toast.error('API communication failure', { id: toastId });
    }
  };

  const handleContactAttendee = (attendee: Attendee) => {
    const subject = encodeURIComponent(`Regarding course: ${course?.title}`);
    const body = encodeURIComponent(`Hello ${attendee.user.name || 'Student'},\n\nI am reaching out to you regarding the course "${course?.title}".\n\n...`);
    window.location.href = `mailto:${attendee.user.email}?subject=${subject}&body=${body}`;
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
    { id: 'quizzes', label: 'Assessments', icon: <Trophy className="w-4 h-4" /> },
    { id: 'attendees', label: 'Attendees', icon: <Users className="w-4 h-4" /> },
    { id: 'reviews', label: 'Learner Reviews', icon: <MessageSquare className="w-4 h-4" /> },
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
              <Badge variant={course.isPublished ? 'success' : 'default'} size="sm">
                {course.isPublished ? 'PUBLISHED' : 'DRAFT'}
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
            variant={course.isPublished ? 'outline' : 'primary'}
            onClick={() => handleUpdate({ isPublished: !course.isPublished })}
            isLoading={isSaving}
          >
            {course.isPublished ? 'Unpublish Course' : 'Publish Course'}
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
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="lessons">
                        {(provided: DroppableProvided) => (
                          <div 
                            {...provided.droppableProps} 
                            ref={provided.innerRef} 
                            className="space-y-2"
                          >
                            {[...course.lessons].sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, index) => (
                              <Draggable key={lesson.id} draggableId={lesson.id} index={index}>
                                {(provided: DraggableProvided) => (
                                  <div 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="flex items-center gap-3 p-3 bg-white border border-border rounded-md hover:border-surface-300 transition-all group shadow-sm sm:shadow-none"
                                  >
                                    <div 
                                      {...provided.dragHandleProps}
                                      className="cursor-grab text-surface-300 group-hover:text-surface-500 active:cursor-grabbing p-1"
                                    >
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
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </div>
              </TabPanel>

              <TabPanel isActive={activeTab === 'details'}>
                <div className="space-y-6 max-w-2xl">
                  <Input
                    label="Published Title"
                    value={course.title}
                    onChange={(e) => setCourse(c => c ? { ...c, title: e.target.value } : null)}
                    hint="The title visible to your learners."
                  />
                  <Textarea
                    label="Course Summary"
                    value={course.description || ''}
                    onChange={(e) => setCourse(c => c ? { ...c, description: e.target.value } : null)}
                    rows={6}
                    hint="A concise breakdown of the course objectives and curriculum."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Course Subject"
                      value={course.subject || ''}
                      onChange={(e) => setCourse(c => c ? { ...c, subject: e.target.value } : null)}
                      placeholder="e.g. Science, Art, Business"
                    />
                    <Select
                      label="Skill Level"
                      value={course.level || ''}
                      onChange={(v) => setCourse(c => c ? { ...c, level: v } : null)}
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
                      onChange={(e) => setCourse(c => c ? { ...c, price: Number(e.target.value) } : null)}
                      placeholder="0 for free courses"
                    />
                  </div>
                  <div className="pt-4 border-t border-border flex justify-end">
                    <Button onClick={() => handleUpdate({
                      title: course.title,
                      description: course.description,
                      level: course.level,
                      subject: course.subject,
                      price: course.price,
                      tags: course.tags
                    })} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                      Save Changes
                    </Button>
                  </div>

                  <div className="pt-8 border-t border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Plus className="w-4 h-4 text-surface-400" />
                      <h4 className="text-sm font-bold text-surface-900">Taxonomy & Tags</h4>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-4 rounded-lg border border-border bg-slate-50/50">
                        {course.tags.length === 0 ? (
                          <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest italic opacity-60">No tags assigned yet...</p>
                        ) : (
                          course.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="bg-white border-primary/20 text-primary flex items-center gap-1.5 px-2.5 py-1 shadow-sm"
                            >
                              {tag.name}
                              <button
                                onClick={() => setCourse(c => c ? {
                                  ...c,
                                  tags: c.tags.filter(t => t.id !== tag.id)
                                } : null)}
                                className="hover:text-destructive transition-colors outline-none"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 relative group">
                          <Input
                            placeholder="Add keyword (e.g. Next.js, UI/UX)..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            className="bg-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTag.trim()) {
                                const tagName = newTag.trim();
                                if (!course.tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())) {
                                  setCourse(c => c ? {
                                    ...c,
                                    tags: [...c.tags, { id: Date.now().toString(), name: tagName }]
                                  } : null);
                                  setNewTag('');
                                }
                              }
                            }}
                          />
                          {newTag.trim() && availableTags.filter(t => t.toLowerCase().includes(newTag.toLowerCase()) && !course.tags.find(ct => ct.name.toLowerCase() === t.toLowerCase())).length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-border rounded-md shadow-lg max-h-40 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 duration-200">
                              {availableTags
                                .filter(t => t.toLowerCase().includes(newTag.toLowerCase()) && !course.tags.find(ct => ct.name.toLowerCase() === t.toLowerCase()))
                                .map(tag => (
                                  <button
                                    key={tag}
                                    onClick={() => {
                                      setCourse(c => c ? {
                                        ...c,
                                        tags: [...c.tags, { id: Date.now().toString(), name: tag }]
                                      } : null);
                                      setNewTag('');
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-50 rounded transition-colors flex items-center justify-between"
                                  >
                                    {tag}
                                    <Plus className="w-3 h-3 text-surface-400" />
                                  </button>
                                ))
                              }
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (newTag.trim()) {
                              const tagName = newTag.trim();
                              if (!course.tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())) {
                                setCourse(c => c ? {
                                  ...c,
                                  tags: [...c.tags, { id: Date.now().toString(), name: tagName }]
                                } : null);
                                setNewTag('');
                              }
                            }
                          }}
                          disabled={!newTag.trim()}
                        >
                          Append
                        </Button>
                      </div>
                      <p className="text-[10px] text-surface-400 leading-normal">
                        Press <kbd className="px-1 border border-border rounded bg-white font-sans">Enter</kbd> to initialize new keyword clusters. These will be used for catalog discovery.
                      </p>
                    </div>
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
                        checked={course.visibility === 'EVERYONE'}
                        onChange={(v) => handleUpdate({ visibility: v ? 'EVERYONE' : 'SIGNED_IN' })}
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

              <TabPanel isActive={activeTab === 'quizzes'}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-extrabold text-surface-900 tracking-tight flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" /> Assessment Registry
                      </h3>
                      <p className="text-sm text-surface-500">Configure certification quizzes and gamified rewards for this course.</p>
                    </div>
                    <Button size="sm" onClick={handleCreateQuiz} leftIcon={<Plus className="w-4 h-4" />}>
                      Initialize Assessment
                    </Button>
                  </div>

                  {quizzes.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-border rounded-lg bg-slate-50">
                      <HelpCircle className="w-12 h-12 text-surface-200 mx-auto mb-4" />
                      <h4 className="text-sm font-bold text-surface-900 mb-1">No Assessments Configured</h4>
                      <p className="text-xs text-surface-500 max-w-xs mx-auto mb-6">Create certification units to validate learner knowledge and award reward points.</p>
                      <Button variant="secondary" size="sm" onClick={handleCreateQuiz}>Add First Assessment</Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {quizzes.map((q) => (
                        <div key={q.id} className="group p-4 bg-white border border-border rounded-xl hover:border-primary/20 transition-all flex items-center gap-6 shadow-sm">
                          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <Trophy className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-surface-900 truncate group-hover:text-primary transition-colors">
                              {q.lesson?.title || 'Unknown Assessment'}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant="secondary" size="sm" className="bg-slate-50 text-[10px]">#{q.lesson?.orderIndex ?? 0}</Badge>
                              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{q._count?.questions ?? 0} Queries</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{q.firstAttemptPoints} Max Pts</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveQuizId(q.id);
                                setIsQuizBuilderOpen(true);
                              }}
                              leftIcon={<FileEdit className="w-3.5 h-3.5" />}
                            >
                              Edit Builder
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => handleDeleteQuiz(q.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabPanel>

              <TabPanel isActive={activeTab === 'attendees'}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Course Attendees
                      </h3>
                      <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">
                        {attendees.length} Active Participants
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<UserPlus className="w-4 h-4" />}
                      onClick={() => setIsInviteModalOpen(true)}
                      disabled={!course.isPublished}
                      title={!course.isPublished ? "Publish course to enable invitations" : ""}
                    >
                      Invite Attendee
                    </Button>
                  </div>

                  {isAttendeesLoading ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : attendees.length === 0 ? (
                    <div className="p-12 text-center rounded border border-dashed border-border bg-slate-50">
                      <Users className="w-8 h-8 text-surface-200 mx-auto mb-3" />
                      <p className="text-sm text-surface-500">No attendees have enrolled in this course yet.</p>
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-surface-50 border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Learner</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Status</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Progress</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Time Mapping</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Enrolled</th>
                            <th className="px-4 py-3 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {attendees.map((attendee) => (
                            <tr key={attendee.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar src={attendee.user.avatarUrl || ''} name={attendee.user.name || 'U'} className="w-8 h-8" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-surface-900 truncate">{attendee.user.name || 'Anonymous Learner'}</p>
                                    <p className="text-[10px] text-surface-400 truncate">{attendee.user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={attendee.status === 'COMPLETED' ? 'success' : 'default'} size="sm" className="font-bold">
                                  {attendee.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 w-16 bg-surface-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${attendee.progress}%` }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-surface-600">{Math.round(attendee.progress)}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs font-bold text-surface-900">{formatTime(attendee.timeSpent)}</span>
                                  <button 
                                    onClick={() => {
                                      setSelectedAttendee(attendee);
                                      setIsTimeBreakdownOpen(true);
                                    }}
                                    className="text-[10px] font-extrabold text-primary uppercase tracking-widest text-left hover:underline"
                                  >
                                    View Breakdown
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-surface-500 font-medium whitespace-nowrap">
                                {new Date(attendee.enrolledAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon-sm" onClick={() => handleContactAttendee(attendee)}>
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </TabPanel>

              <TabPanel isActive={activeTab === 'reviews'}>
                <div className="h-[600px] border border-border rounded-xl overflow-hidden">
                  <CourseReviews courseId={id as string} readOnly />
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
                <p className="text-xs font-medium text-surface-700">{course.instructor?.name || 'Unknown'} - Instructor</p>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-primary">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{course.enrollmentsCount || 0} Active Enrollments</span>
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

                {lessonForm.type === 'QUIZ' && (
                  <div className="p-8 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/30 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-sm">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-surface-900">Assessment Architecture Registry</p>
                      <p className="text-xs text-surface-500 max-w-xs leading-relaxed">
                        Certification units require question configuration and reward tiers. This management is handled via the centralized builder.
                      </p>
                    </div>
                    {editingLessonId ? (
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-amber-500 hover:bg-amber-600 border-none px-6"
                        onClick={() => handleOpenQuizBuilderForLesson(editingLessonId)}
                      >
                        Open Quiz Builder
                      </Button>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Badge variant="outline" className="text-amber-600 border-amber-200">Pending Assignment</Badge>
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest leading-relaxed">
                          Save this unit first to initialize <br /> the assessment architecture.
                        </p>
                      </div>
                    )}
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

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite New Attendee"
        description="This will generate a shareable course link and open your email client to send the invitation."
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} leftIcon={<Mail className="w-4 h-4" />}>Compose Invite</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Recipient Email"
            placeholder="learner@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            autoFocus
          />
          {!course.isPublished && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[10px] font-bold text-amber-700 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              This course is currently a DRAFT. Learners will not be able to access it even with this link.
            </div>
          )}
          <div className="p-3 bg-slate-50 border border-border rounded text-[10px] font-medium text-surface-500 flex items-center gap-2">
            <ExternalLinkIcon className="w-3.5 h-3.5 text-primary" />
            <p className="flex-1 truncate">Link: https://elearnsphere.vercel.app/learn/{id}</p>
            <Button variant="ghost" size="icon-sm" onClick={() => {
              const url = `https://elearnsphere.vercel.app/learn/${id}`;
              navigator.clipboard.writeText(url);
              toast.success('Link copied to clipboard');
            }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Modal>

      {/* Time Breakdown Modal */}
      <Modal
        isOpen={isTimeBreakdownOpen}
        onClose={() => setIsTimeBreakdownOpen(false)}
        title="Learning Duration Breakdown"
        description={`Detailed time allocation for ${selectedAttendee?.user.name || 'Learner'}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-border flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Total Course Runtime</p>
              <p className="text-xl font-black text-surface-900">{formatTime(selectedAttendee?.timeSpent || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Curriculum Progress</p>
              <p className="text-xl font-black text-primary">{Math.round(selectedAttendee?.progress || 0)}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest">Unit Wise Breakdown</p>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white border-b border-border sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-bold text-surface-500">Module Unit</th>
                      <th className="px-4 py-2 font-bold text-surface-500 text-right">Time Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {selectedAttendee?.user.lessonProgress.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-surface-400 italic">No activity recorded yet</td>
                      </tr>
                    ) : (
                      selectedAttendee?.user.lessonProgress.map((lp, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                lp.isCompleted ? "bg-green-500" : "bg-amber-400"
                              )} />
                              <span className="font-medium text-surface-900">{lp.lesson.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-surface-700">
                            {formatTime(lp.timeSpent)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Quiz Builder Modal */}
      <Modal
        isOpen={isQuizBuilderOpen}
        onClose={() => setIsQuizBuilderOpen(false)}
        title="Assessment Intelligence Builder"
        size="xl"
      >
        {activeQuizId && (
          <QuizBuilder
            quizId={activeQuizId}
            onClose={() => {
              setIsQuizBuilderOpen(false);
              fetchQuizzes();
            }}
          />
        )}
      </Modal>
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isDeleteLessonDialogOpen}
        onClose={() => setIsDeleteLessonDialogOpen(false)}
        onConfirm={confirmDeleteLesson}
        title="Expunge Module"
        description="This module and all its associated metadata, including video assets and descriptions, will be permanently expunged from the registry. This action is irreversible."
        confirmText="Confirm"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={isDeleteQuizDialogOpen}
        onClose={() => setIsDeleteQuizDialogOpen(false)}
        onConfirm={confirmDeleteQuiz}
        title="Decommission Assessment"
        description="Are you certain you wish to decommission this assessment? This action will expunge all questions, rewards logic, and historical attempt metadata."
        confirmText="Confirm Decommission"
        isLoading={isDeleting}
      />
    </div>
  );
}
