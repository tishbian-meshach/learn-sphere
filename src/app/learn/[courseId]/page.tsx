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
  content: string | null;
  videoUrl: string | null;
  order: number;
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
    fetchCourseAndProgress();
  }, [courseId]);

  const fetchCourseAndProgress = async () => {
    try {
      const [courseRes, progressRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/progress?courseId=${courseId}`)
      ]);

      if (courseRes.ok && progressRes.ok) {
        const courseData = await courseRes.json();
        const progressData = await progressRes.json();
        
        setCourse(courseData);
        setCompletedLessons(new Set(progressData.completedLessons));
        
        if (courseData.lessons.length > 0) {
          setActiveLessonId(courseData.lessons[0].id);
        }
      }
    } catch (error) {
      toast.error('Failed to initialize session');
    } finally {
      setIsLoading(false);
    }
  };

  const activeLesson = course?.lessons.find(l => l.id === activeLessonId);
  const activeIndex = course?.lessons.findIndex(l => l.id === activeLessonId) ?? 0;
  const progressPercent = course?.lessons.length 
    ? (completedLessons.size / course.lessons.length) * 100 
    : 0;

  const handleComplete = async () => {
    if (!activeLessonId || !courseId) return;
    
    try {
      const res = await fetch('/api/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        if (course && activeIndex < course.lessons.length - 1) {
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

  if (!course) return null;

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
                  <div className="aspect-video bg-surface-900 flex items-center justify-center">
                    {activeLesson.videoUrl ? (
                      <iframe 
                        src={activeLesson.videoUrl} 
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : (
                      <Video className="w-12 h-12 text-surface-700" />
                    )}
                  </div>
                ) : (
                  <div className="p-8 md:p-12 prose prose-slate max-w-none">
                     <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
                        <Badge variant="primary" size="sm">{activeLesson?.type}</Badge>
                        <h2 className="text-2xl font-extrabold text-surface-900 m-0">{activeLesson?.title}</h2>
                     </div>
                     <div className="text-surface-700 leading-relaxed">
                        {activeLesson?.content || "This unit has no textual content provided."}
                     </div>
                  </div>
                )}
             </div>

             {/* Footer Actions */}
             <div className="flex items-center justify-between py-6 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveLessonId(course.lessons[activeIndex - 1].id)}
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
                     disabled={activeIndex === course.lessons.length - 1}
                     onClick={() => {
                        handleComplete();
                        setActiveLessonId(course.lessons[activeIndex + 1].id);
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
             {Array.from(course.lessons).map((lesson, idx) => {
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
