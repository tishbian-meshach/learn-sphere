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
  Trophy,
  HelpCircle,
  Plus,
  AlertCircle,
  Save,
  Star,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { CourseReviews } from '@/components/shared/CourseReviews';
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

  // Quiz Player State
  const [quizData, setQuizData] = useState<any>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [isQuestionVerified, setIsQuestionVerified] = useState(false);
  const [quizPhase, setQuizPhase] = useState<'INTRO' | 'PLAYING' | 'RESULTS'>('INTRO');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizResults, setQuizResults] = useState<any>(null);

  // Reviews State
  const [activeTab, setActiveTab] = useState<'syllabus' | 'reviews'>('syllabus');

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
        
        if (courseData.lessons && courseData.lessons.length > 0 && !activeLessonId) {
          setActiveLessonId(courseData.lessons[0].id);
        }

        // Check if user is already enrolled, if not, enroll them
        const enrollCheckRes = await fetch(`/api/enrollments?userId=${user?.id}&courseId=${courseId}`);
        const enrollments = await enrollCheckRes.json();
        
        if (!enrollments || enrollments.length === 0) {
          await fetch('/api/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user?.id, courseId })
          });
        }
      }
    } catch (error) {
      console.error('Session initialization warning:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews') {
      // No need to fetch reviews here, component handles it
    }
  }, [activeTab]);
  const activeLesson = course?.lessons?.find(l => l.id === activeLessonId);
  const activeIndex = course?.lessons?.findIndex(l => l.id === activeLessonId) ?? 0;

  const fetchQuizData = async (lessonId: string) => {
    setIsLoadingQuiz(true);
    setQuizPhase('INTRO');
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOptionIndex(null);
    setQuizResults(null);
    setIsQuestionVerified(false);
    
    try {
      // Find the quiz linked to this lesson
      // Quizzes are 1:1 with lessons, but we need the quiz ID
      // We'll fetch it from an endpoint that finds it by lessonId
      const res = await fetch(`/api/quizzes/by-lesson/${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setQuizData(data);
      } else {
        setQuizData(null);
      }
    } catch (error) {
      console.error('Failed to load quiz');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  useEffect(() => {
    if (activeLesson?.type === 'QUIZ') {
      fetchQuizData(activeLesson.id);
    }
  }, [activeLessonId, activeLesson?.type]);

  const handleStartQuiz = () => {
    setQuizPhase('PLAYING');
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOptionIndex(null);
    setIsQuestionVerified(false);
  };

  const handleVerify = () => {
    if (!quizData || selectedOptionIndex === null || isQuestionVerified) return;
    
    setIsQuestionVerified(true);
    const currentQuestion = quizData.questions[currentQuestionIndex];
    if (currentQuestion.options[selectedOptionIndex].isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleProceed = () => {
    if (!quizData || !isQuestionVerified) return;

    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setIsQuestionVerified(false);
    } else {
      // Finalize Quiz
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizData || !user) return;
    setIsSubmittingQuiz(true);

    try {
      // Calculate final score including the last question
      const currentQuestion = quizData.questions[currentQuestionIndex];
      const finalScore = score + (currentQuestion.options[selectedOptionIndex!].isCorrect ? 1 : 0);

      const res = await fetch(`/api/quizzes/${quizData.id}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          score: finalScore,
          // We can add detailed answers here if needed later
        })
      });

      if (res.ok) {
        const results = await res.json();
        const percentScore = finalScore / quizData.questions.length;
        const isPassed = percentScore >= 0.8;
        
        setQuizResults({ ...results, isPassed });
        setQuizPhase('RESULTS');
        
        if (isPassed) {
          // Mark lesson as completed in local state
          setCompletedLessons(prev => {
            const next = new Set(Array.from(prev));
            next.add(activeLessonId!);
            return next;
          });
          
          // Sync with backend
          fetch('/api/progress', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              courseId,
              lessonId: activeLessonId,
              isCompleted: true
            })
          }).catch(err => console.error('Failed to sync progress:', err));

          toast.success(`Assessment Certified! Earned ${results.pointsEarned} points.`);
        } else {
          toast.error(`Certification Failed. Required 80%, achieved ${(percentScore * 100).toFixed(0)}%.`);
        }
      }
    } catch (error) {
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

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
        <Button variant="outline" size="sm" onClick={() => router.push('/learner/my-courses')}>
          Return to My Library
        </Button>
      </div>
    );
  }

  // Handle courses with no lessons
  if (!course.lessons || course.lessons.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        <header className="h-12 border-b border-border bg-white px-4 flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push('/learner/my-courses')}>
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
          <Button variant="ghost" size="icon-sm" onClick={() => router.push('/learner/my-courses')}>
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
                 <span className="text-[10px] font-extrabold text-surface-700">{Math.round(progressPercent)}%</span>
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
                  ) : activeLesson?.type === 'QUIZ' ? (
                    <div className="min-h-[500px] bg-slate-50 flex flex-col relative border-b border-border">
                      {isLoadingQuiz ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                           <Loader2 className="w-10 h-10 animate-spin text-primary" />
                           <p className="text-sm font-bold text-surface-400 uppercase tracking-widest">Initializing Logic...</p>
                        </div>
                      ) : !quizData ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                           <HelpCircle className="w-12 h-12 text-surface-200" />
                           <div className="space-y-1">
                              <p className="text-sm font-bold text-surface-900">Assessment Logic Pending</p>
                              <p className="text-xs text-surface-500">The instructor has not yet populated this assessment registry.</p>
                           </div>
                        </div>
                      ) : quizPhase === 'INTRO' ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4">
                           <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-6 shadow-sm">
                              <Trophy className="w-8 h-8" />
                           </div>
                           <h3 className="text-2xl font-extrabold text-surface-900 tracking-tight mb-2">Certification Assessment</h3>
                           <p className="text-sm text-surface-500 mb-8 leading-relaxed">
                              This evaluation contains <strong>{quizData.questions.length} queries</strong>. 
                              Successful completion awards reward points based on attempt tiers.
                           </p>
                           <div className="flex flex-col w-full gap-3">
                              <Button className="w-full" size="lg" onClick={handleStartQuiz}>Start Certification</Button>
                              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                 Multiple Attempts Permitted <CheckCircle className="w-3 h-3 text-emerald-500" />
                              </p>
                           </div>
                        </div>
                      ) : quizPhase === 'PLAYING' ? (
                        <div className="w-full flex-1 flex flex-col p-8 md:p-12 animate-in fade-in">
                           <div className="flex items-center justify-between mb-8">
                              <div className="space-y-1">
                                 <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
                                 <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary transition-all duration-500" 
                                      style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
                                    />
                                 </div>
                              </div>
                              <Badge variant="outline" className="font-mono text-[10px] font-bold">MODE: EVALUATION</Badge>
                           </div>

                           <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full">
                              <h3 className="text-xl md:text-2xl font-extrabold text-surface-900 mb-8 leading-tight">
                                 {quizData.questions[currentQuestionIndex].text}
                              </h3>

                              <div className="grid gap-3">
                                 {quizData.questions[currentQuestionIndex].options.map((option: any, idx: number) => {
                                    const isSelected = selectedOptionIndex === idx;
                                    const isCorrect = option.isCorrect;
                                    
                                    let buttonState = "normal";
                                    if (isQuestionVerified) {
                                       if (isSelected && isCorrect) buttonState = "correct";
                                       else if (isSelected && !isCorrect) buttonState = "incorrect";
                                       // We no longer reveal the correct answer if the user didn't pick it
                                    } else if (isSelected) {
                                       buttonState = "selected";
                                    }

                                    return (
                                       <button
                                         key={idx}
                                         onClick={() => !isQuestionVerified && setSelectedOptionIndex(idx)}
                                         disabled={isQuestionVerified}
                                         className={cn(
                                           "w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 group relative overflow-hidden",
                                           buttonState === "selected" && "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20",
                                           buttonState === "correct" && "bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20",
                                           buttonState === "incorrect" && "bg-rose-50 border-rose-500 shadow-sm ring-1 ring-rose-500/20",
                                           buttonState === "normal" && "bg-white border-border hover:border-primary/40 hover:bg-slate-50",
                                           isQuestionVerified && buttonState === "normal" && "opacity-60 grayscale-[0.5]"
                                         )}
                                       >
                                          <div className={cn(
                                             "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                             buttonState === "selected" && "bg-primary border-primary text-white",
                                             buttonState === "correct" && "bg-emerald-500 border-emerald-500 text-white",
                                             buttonState === "incorrect" && "bg-rose-500 border-rose-500 text-white",
                                             buttonState === "normal" && "bg-white border-border group-hover:border-primary/40"
                                          )}>
                                             {buttonState === "selected" && <div className="w-2 h-2 rounded-full bg-white" />}
                                             {buttonState === "correct" && <CheckCircle className="w-3.5 h-3.5" />}
                                             {buttonState === "incorrect" && <AlertCircle className="w-3.5 h-3.5" />}
                                          </div>
                                          <span className={cn(
                                             "text-sm font-semibold transition-colors",
                                             (buttonState === "selected" || buttonState === "correct" || buttonState === "incorrect") ? "text-surface-900" : "text-surface-600 group-hover:text-surface-900"
                                          )}>{option.text}</span>
                                          
                                          {isQuestionVerified && isCorrect && (
                                             <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Badge variant="success" size="sm" className="bg-emerald-100 text-emerald-700 border-emerald-200">VALIDATED</Badge>
                                             </div>
                                          )}
                                       </button>
                                    );
                                 })}
                              </div>
                           </div>

                            <div className="mt-8 flex justify-end">
                               {!isQuestionVerified ? (
                                 <Button 
                                   size="lg" 
                                   disabled={selectedOptionIndex === null} 
                                   onClick={handleVerify}
                                   rightIcon={<Save className="w-5 h-5" />}
                                 >
                                    Verify Answer
                                 </Button>
                               ) : (
                                 <Button 
                                   size="lg" 
                                   isLoading={isSubmittingQuiz}
                                   onClick={handleProceed}
                                   rightIcon={<ChevronRight className="w-5 h-5" />}
                                 >
                                    {currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'Submit Final Assessment'}
                                 </Button>
                               )}
                            </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto animate-in zoom-in-95">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm border animate-in zoom-in-50 duration-500">
                               {quizResults?.isPassed ? (
                                 <div className="w-full h-full rounded-full bg-emerald-50 border-emerald-100 flex items-center justify-center text-emerald-500">
                                    <CheckCircle className="w-10 h-10" />
                                 </div>
                               ) : (
                                 <div className="w-full h-full rounded-full bg-rose-50 border-rose-100 flex items-center justify-center text-rose-500">
                                    <AlertCircle className="w-10 h-10" />
                                 </div>
                               )}
                            </div>
                            
                            <h3 className="text-2xl font-extrabold text-surface-900 tracking-tight mb-2">
                               {quizResults?.isPassed ? 'Certification Finalized!' : 'Evaluation Incomplete'}
                            </h3>
                            <p className="text-sm text-surface-500 mb-6">
                               {quizResults?.isPassed 
                                 ? 'Evaluation complete. High precision detected in assessment responses.' 
                                 : 'Minimum passing threshold not achieved. Further study recommended before re-evaluation.'}
                            </p>

                            <div className="w-full bg-white border border-border rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <p className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest text-left">Precision Score</p>
                                  <div className="flex items-baseline gap-2">
                                     <p className="text-2xl font-extrabold text-surface-900">{quizResults?.score}/{quizData.questions.length}</p>
                                     <span className={cn(
                                       "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                                       quizResults?.isPassed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                     )}>
                                        {((quizResults?.score / quizData.questions.length) * 100).toFixed(0)}%
                                     </span>
                                  </div>
                               </div>
                               <div className="space-y-1 border-l border-border pl-4">
                                  <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest text-left">Points Earned</p>
                                  <p className="text-2xl font-extrabold text-amber-600 text-left">+{quizResults?.isPassed ? (quizResults?.pointsEarned || 0) : 0}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 w-full">
                               <Button variant="outline" className="flex-1" onClick={handleStartQuiz}>Refine Phase</Button>
                               {course && activeIndex < course.lessons.length - 1 && (
                                 <Button 
                                   className="flex-1" 
                                   disabled={!quizResults?.isPassed}
                                   onClick={() => {
                                      setActiveLessonId(course.lessons[activeIndex + 1].id);
                                   }}
                                 >
                                    {quizResults?.isPassed ? 'Next Module' : 'Pass Required'}
                                 </Button>
                               )}
                            </div>
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
          <div className="flex items-center border-b border-border">
            <button
              onClick={() => setActiveTab('syllabus')}
              className={cn(
                "flex-1 p-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2",
                activeTab === 'syllabus' ? "border-primary text-primary bg-primary/5" : "border-transparent text-surface-500 hover:text-surface-900 hover:bg-slate-50"
              )}
            >
              Syllabus
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={cn(
                "flex-1 p-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2",
                activeTab === 'reviews' ? "border-primary text-primary bg-primary/5" : "border-transparent text-surface-500 hover:text-surface-900 hover:bg-slate-50"
              )}
            >
              Reviews
            </button>
          </div>

          {activeTab === 'syllabus' ? (
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
           ) : (
             <div className="flex-1 overflow-hidden">
               <CourseReviews courseId={courseId as string} />
             </div>
           )}
        </aside>
      </div>
    </div>
  );
}
