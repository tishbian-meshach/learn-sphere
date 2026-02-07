'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Circle,
  GraduationCap,
  ArrowLeft,
  Loader2,
  Lock,
  Video,
  BookOpen,
  Download,
  Link as LinkIcon,
  ExternalLink,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'QUIZ';
  description: string | null;
  videoUrl: string | null;
  documentUrl: string | null;
  imageUrl: string | null;
  allowDownload: boolean;
  responsible: string | null;
  orderIndex: number;
  attachments: { id: string; name: string; url: string; isExternal: boolean }[];
}

interface Course {
  id: string;
  title: string;
  lessons: Lesson[];
}

export default function LessonPlayerPage() {
  const router = useRouter();
  const { courseId } = useParams();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && courseId) {
      fetchCourseAndProgress();
    }
  }, [courseId, user]);

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    return null;
  };

  const isDirectVideo = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || 
           url.includes('supabase.co/storage/v1/object/public/') ||
           url.includes('googleusercontent.com'); // Handles some external direct links
  };

  const fetchCourseAndProgress = async () => {
    try {
      const [courseRes, progressRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/progress?courseId=${courseId}&userId=${user?.id}`)
      ]);

      if (courseRes.ok && progressRes.ok) {
        const courseData = await courseRes.json();
        const progressData = await progressRes.json();
        
        setCourse(courseData);
        setCompletedLessons(new Set((progressData || []).map((p: any) => p.lessonId)));
        
        if (courseData.lessons && courseData.lessons.length > 0) {
          setActiveLessonId(courseData.lessons[0].id);
        }

        // Auto-enroll if not already enrolled (useful for direct navigation/free courses)
        await fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id, courseId })
        });
      }
    } catch (error) {
      toast.error('Failed to initialize session');
    } finally {
      setIsLoading(false);
    }
  };

  const activeLesson = course?.lessons?.find(l => l.id === activeLessonId);
  const activeIndex = course?.lessons?.findIndex(l => l.id === activeLessonId) ?? 0;
  const progressPercent = course?.lessons?.length 
    ? (completedLessons.size / course.lessons.length) * 100 
    : 0;

  const handleComplete = async () => {
    if (!activeLessonId || !courseId) return;
    
    try {
      const res = await fetch('/api/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          courseId,
          lessonId: activeLessonId,
          isCompleted: true
        })
      });

      if (res.ok) {
        setCompletedLessons(prev => {
          const next = new Set(Array.from(prev));
          next.add(activeLessonId);
          return next;
        });
        toast.success('Module unit certified');
        
        // Auto-navigate to next
        if (course && course.lessons && activeIndex < course.lessons.length - 1) {
          setActiveLessonId(course.lessons[activeIndex + 1].id);
        }
      }
    } catch (error) {
      toast.error('Progress sync failed');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
        <BookOpen className="w-12 h-12 text-surface-300" />
        <p className="text-surface-500 font-medium">Course not found or failed to load</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // Handle courses with no lessons
  if (!course.lessons || course.lessons.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        <header className="h-12 border-b border-border bg-white px-4 flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-bold text-surface-900">{course.title}</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <BookOpen className="w-16 h-16 text-surface-200" />
          <h2 className="text-xl font-bold text-surface-700">No Content Available</h2>
          <p className="text-surface-500 text-sm max-w-md text-center">
            This course has no lessons yet. Please check back later or contact the instructor.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push('/learner/courses')}>
            Browse Other Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Immersive Header */}
      <header className="h-12 border-b border-border bg-white px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
               <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-sm font-extrabold text-surface-900 truncate max-w-[300px]">
              {course.title}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider">Global Progress</span>
              <div className="flex items-center gap-3">
                 <Progress value={progressPercent} size="sm" className="w-32" />
                 <span className="text-[10px] font-extrabold text-surface-700">        {Math.round(progressPercent)}%</span>
              </div>
           </div>
           <Button variant="outline" size="icon-sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
           </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50">
          <div className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8">
             {/* Content Carrier */}
             <div className="card shadow-none p-0 overflow-hidden bg-white">
                  {activeLesson?.type === 'VIDEO' ? (
                    <div className="aspect-video bg-surface-900 flex items-center justify-center relative">
                      {activeLesson.videoUrl ? (
                        getVideoEmbedUrl(activeLesson.videoUrl) ? (
                          <iframe 
                            src={getVideoEmbedUrl(activeLesson.videoUrl)!} 
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : isDirectVideo(activeLesson.videoUrl) ? (
                          <video 
                            src={activeLesson.videoUrl} 
                            className="w-full h-full" 
                            controls 
                            controlsList="nodownload"
                          />
                        ) : (
                          <iframe 
                            src={activeLesson.videoUrl} 
                            className="w-full h-full"
                            allowFullScreen
                          />
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                           <Video className="w-12 h-12 text-surface-700" />
                           <p className="text-surface-500 text-sm">No video source configured.</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                   <div className="p-8 md:p-12 prose prose-slate max-w-none">
                      <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
                         <Badge variant="primary" size="sm">{activeLesson?.type}</Badge>
                         <h2 className="text-2xl font-extrabold text-surface-900 m-0">{activeLesson?.title}</h2>
                      </div>
                      
                      {activeLesson?.responsible && (
                        <div className="flex items-center gap-2 mb-6 text-surface-500 bg-slate-50 p-3 rounded-md border border-border">
                           <User className="w-4 h-4" />
                           <span className="text-xs font-bold uppercase tracking-wider">Stakeholder: {activeLesson.responsible}</span>
                        </div>
                      )}

                       <div className="text-surface-700 leading-relaxed whitespace-pre-wrap">
                          {activeLesson?.description || "This unit has no textual exposition provided."}
                       </div>

                       {/* Rich Preview Section */}
                       <div className="mt-8 space-y-6">
                          {activeLesson?.type === 'DOCUMENT' && activeLesson.documentUrl && (
                            <div className="space-y-4">
                               <div className="flex items-center gap-3 border-b border-border pb-2">
                                  <FileText className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Document Artifact Preview</span>
                               </div>
                               <div className="aspect-[4/5] w-full rounded-md border border-border bg-slate-50 overflow-hidden shadow-inner">
                                  <iframe 
                                    src={`${activeLesson.documentUrl}#toolbar=0&navpanes=0`} 
                                    className="w-full h-full"
                                    title="Technical Resource Preview"
                                  />
                               </div>
                               <div className="p-4 rounded-md border border-primary/20 bg-primary/5 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <FileText className="w-5 h-5 text-primary" />
                                     <div className="text-sm">
                                        <p className="font-bold text-surface-900">Technical Resource Available</p>
                                        <p className="text-xs text-surface-500">Access the full documentation for this module.</p>
                                     </div>
                                  </div>
                                  <Button asChild size="sm">
                                     <a href={activeLesson.documentUrl} target="_blank" download={activeLesson.allowDownload}>
                                        {activeLesson.allowDownload ? <Download className="w-4 h-4 mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                                        Access Guide
                                     </a>
                                  </Button>
                               </div>
                            </div>
                          )}

                          {activeLesson?.type === 'IMAGE' && activeLesson.imageUrl && (
                            <div className="space-y-4">
                               <div className="flex items-center gap-3 border-b border-border pb-2">
                                  <ImageIcon className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Image Asset Preview</span>
                               </div>
                               <div className="rounded-md border border-border bg-white overflow-hidden shadow-sm">
                                  <img src={activeLesson.imageUrl} className="w-full h-auto" alt={activeLesson.title} />
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
              </div>

              {/* Supplementary Attachments */}
              {activeLesson?.attachments && activeLesson.attachments.length > 0 && (
                <div className="space-y-4">
                   <h3 className="text-xs font-extrabold text-surface-400 uppercase tracking-widest flex items-center gap-2">
                      <LinkIcon className="w-3 h-3" /> Supplementary Artifacts
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeLesson.attachments.map((a) => (
                        <a 
                          key={a.id} 
                          href={a.url} 
                          target="_blank" 
                          className="flex items-center justify-between p-4 rounded-md border border-border bg-white hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded border border-border bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                 <Plus className="w-3.5 h-3.5 text-surface-400" />
                              </div>
                              <span className="text-sm font-semibold text-surface-700">{a.name}</span>
                           </div>
                           <ChevronRight className="w-4 h-4 text-surface-300 group-hover:text-primary transition-colors" />
                        </a>
                      ))}
                   </div>
                </div>
              )}

             {/* Footer Actions */}
             <div className="flex items-center justify-between py-6 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={activeIndex === 0}
                  onClick={() => activeIndex > 0 && setActiveLessonId(course.lessons[activeIndex - 1].id)}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prior Unit
                </Button>
                
                <div className="flex items-center gap-3">
                   {activeLessonId && !completedLessons.has(activeLessonId) && (
                     <Button size="sm" variant="outline" onClick={handleComplete} leftIcon={<CheckCircle className="w-4 h-4" />}>
                        Certify Completion
                     </Button>
                   )}
                   <Button 
                     size="sm"
                     disabled={activeIndex >= course.lessons.length - 1}
                     onClick={() => {
                        handleComplete();
                        if (activeIndex < course.lessons.length - 1) {
                          setActiveLessonId(course.lessons[activeIndex + 1].id);
                        }
                     }}
                     rightIcon={<ChevronRight className="w-4 h-4" />}
                   >
                     Following Unit
                   </Button>
                </div>
             </div>
          </div>
        </main>

        {/* Dense Sidebar - Curriculum */}
        <aside className={cn(
          "border-l border-border bg-white transition-all duration-300 overflow-hidden flex flex-col",
          isSidebarOpen ? "w-80" : "w-0"
        )}>
          <div className="p-4 border-b border-border bg-slate-50/50">
             <h3 className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wider">Syllabus Registry</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
             {(course.lessons || []).sort((a: any, b: any) => a.orderIndex - b.orderIndex).map((lesson, idx) => {
               const isActive = lesson.id === activeLessonId;
               const isCompleted = completedLessons.has(lesson.id);
               
               return (
                 <button
                   key={lesson.id}
                   onClick={() => setActiveLessonId(lesson.id)}
                   className={cn(
                     "w-full flex items-center gap-3 p-4 border-b border-border text-left transition-colors",
                     isActive ? "bg-primary/5 cursor-default" : "hover:bg-slate-50"
                   )}
                 >
                   <div className="flex-shrink-0 relative">
                     {isCompleted ? (
                       <CheckCircle className="w-5 h-5 text-emerald-500" />
                     ) : (
                       <Circle className={cn("w-5 h-5", isActive ? "text-primary" : "text-surface-300")} />
                     )}
                     <span className="absolute -top-1 -right-1 text-[8px] font-extrabold text-surface-400">{idx + 1}</span>
                   </div>
                   <div className="min-w-0">
                      <p className={cn("text-xs font-bold truncate", isActive ? "text-primary" : "text-surface-700")}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                         {lesson.type === 'VIDEO' && <PlayCircle className="w-3 h-3 text-surface-400" />}
                         {lesson.type === 'DOCUMENT' && <FileText className="w-3 h-3 text-surface-400" />}
                         {lesson.type === 'QUIZ' && <CheckCircle className="w-3 h-3 text-surface-400" />}
                         <span className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">{lesson.type}</span>
                      </div>
                   </div>
                   {isActive && <div className="ml-auto w-1 h-6 bg-primary rounded-full shrink-0" />}
                 </button>
               );
             })}
          </div>
        </aside>
      </div>
    </div>
  );
}
