'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Clock,
  Award,
  BookOpen,
  PieChart,
  ArrowLeft,
  Calendar,
  Zap,
  CheckCircle,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Loader2,
  Settings,
  MoreHorizontal,
  Briefcase,
  Users,
  Star,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface DossierData {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
  totalPoints: number;
  badgeLevel: string;
  createdAt: string;
  enrollments: any[];
  lessonProgress: any[];
  coursesCreated: any[];
  completedCourses: number;
}

export default function UserDossierPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<DossierData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDossier();
  }, [id]);

  const fetchDossier = async () => {
    try {
      const res = await fetch(`/api/users/${id}`);
      if (res.ok) {
        const dossier = await res.json();
        setData(dossier);
      } else {
        toast.error('Failed to retrieve user dossier');
        router.push('/admin/users');
      }
    } catch (error) {
      toast.error('Operational failure');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-bold text-surface-500 uppercase tracking-widest">Retrieving Official Dossier...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-surface-500 hover:text-surface-900 font-bold uppercase tracking-widest text-[10px]"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back to Registry
        </Button>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Persistent Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border" />
            <div className="px-6 pb-6 -mt-12 text-center">
              <div className="inline-block p-1 bg-white rounded-full border border-border shadow-md mb-4">
                <Avatar src={data.avatarUrl || ''} name={data.name || ''} className="h-20 w-20 ring-4 ring-white" />
              </div>
              <h2 className="text-xl font-extrabold text-surface-900">{data.name || 'Anonymous Practitioner'}</h2>
              <p className="text-xs text-surface-500 font-medium mb-4">{data.email}</p>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <Badge variant={data.role === 'ADMIN' ? 'error' : data.role === 'INSTRUCTOR' ? 'primary' : 'outline'} size="sm" className="font-extrabold uppercase tracking-widest text-[9px]">
                  {data.role}
                </Badge>
                <Badge variant="secondary" size="sm" className="font-extrabold uppercase tracking-widest text-[9px]">
                  {data.badgeLevel}
                </Badge>
              </div>

              {/* Dynamic Stats Row Based on Role */}
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-6 mt-2">
                {data.role === 'INSTRUCTOR' || data.role === 'ADMIN' ? (
                  <>
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest mb-1">Catalog Size</p>
                      <p className="text-lg font-black text-surface-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-primary" />
                        {data.coursesCreated.length}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest mb-1">Total Impact</p>
                      <p className="text-lg font-black text-surface-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-500" />
                        {data.coursesCreated.reduce((acc: number, c: any) => acc + (c._count?.enrollments || 0), 0)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest mb-1">Total Points</p>
                      <p className="text-lg font-black text-surface-900 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {data.totalPoints}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest mb-1">Completions</p>
                      <p className="text-lg font-black text-surface-900 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        {data.completedCourses}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="bg-white border border-border rounded-xl p-6 space-y-5 shadow-sm">
            <h3 className="text-[10px] font-black text-surface-900 uppercase tracking-[0.2em] mb-2">Subject Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-surface-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider mb-0.5">Registration Date</p>
                  <p className="text-sm font-bold text-surface-900">{new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-surface-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider mb-0.5">Authorization ID</p>
                  <p className="text-[10px] font-mono font-bold text-surface-600 break-all">{data.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Role-Based Content Sections */}
        <div className="lg:col-span-2 space-y-8">

          {/* INSTRUCTOR & ADMIN DOSSIER: Authoring Metrics & Catalog */}
          {(data.role === 'INSTRUCTOR' || data.role === 'ADMIN') && (
            <>
              <section className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-surface-900 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" /> Curricular Catalog
                    </h3>
                    <p className="text-xs text-surface-500 font-medium">Tracking authored content and student distribution.</p>
                  </div>
                  <Badge variant="outline" className="font-bold text-[10px]">AUTHORED: {data.coursesCreated.length}</Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {data.coursesCreated.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 border border-dashed border-border rounded-xl">
                      <p className="text-sm text-surface-400 font-bold uppercase tracking-widest">No Authored Content Found</p>
                    </div>
                  ) : (
                    data.coursesCreated.map((course) => (
                      <div key={course.id} className="bg-white border border-border p-4 rounded-xl shadow-sm hover:border-surface-300 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-surface-50 border border-border flex-shrink-0 overflow-hidden">
                            {course.imageUrl ? (
                              <img src={course.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-surface-300">
                                <BookOpen className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-extrabold text-surface-900 group-hover:text-primary transition-colors truncate">{course.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {course.tags.slice(0, 2).map((t: any) => (
                                <span key={t.id} className="text-[9px] font-black bg-surface-100 text-surface-500 px-1.5 py-0.5 rounded uppercase tracking-widest">{t.name}</span>
                              ))}
                              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">• {course.level || 'General'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-surface-900">{course._count?.enrollments || 0}</p>
                            <p className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">Enrollments</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <PieChart className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">Instructional Impact</h4>
                    <p className="text-2xl font-black">Performance Summary</p>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <p className="text-3xl font-black mb-1">{data.coursesCreated.reduce((acc: number, c: any) => acc + (c._count?.enrollments || 0), 0)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Learners</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black mb-1">{data.coursesCreated.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Active Units</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black mb-1">4.8</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Avg Rating</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* LEARNER DOSSIER: Curricular Engagement & Activity */}
          {data.role === 'LEARNER' && (
            <>
              <section className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-surface-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" /> Curricular Engagement
                    </h3>
                    <p className="text-xs text-surface-500 font-medium">Monitoring active and historical course participations.</p>
                  </div>
                  <Badge variant="outline" className="font-bold text-[10px]">{data.enrollments.length} Records</Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {data.enrollments.length === 0 ? (
                    <div className="p-12 text-center bg-surface-50 border border-dashed border-border rounded-xl">
                      <p className="text-sm text-surface-400 font-bold uppercase tracking-widest">No Active Enrollments</p>
                    </div>
                  ) : (
                    data.enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="bg-white border border-border p-4 rounded-xl shadow-sm hover:border-surface-300 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-surface-50 border border-border flex-shrink-0 overflow-hidden">
                            {enrollment.course.imageUrl ? (
                              <img src={enrollment.course.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-surface-300">
                                <BookOpen className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-extrabold text-surface-900 group-hover:text-primary transition-colors truncate">{enrollment.course.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{enrollment.course.subject}</span>
                              <span className="w-1 h-1 rounded-full bg-surface-200" />
                              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{enrollment.course.level}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={enrollment.status === 'COMPLETED' ? 'success' : 'primary'} size="sm" className="font-extrabold text-[9px] uppercase tracking-tighter">
                              {enrollment.status}
                            </Badge>
                            <p className="text-[10px] font-bold text-surface-400 mt-1 uppercase tracking-widest">{Math.round(enrollment.progress)}% Progress</p>
                          </div>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-surface-50 rounded-full overflow-hidden border border-surface-100">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              enrollment.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-primary'
                            )}
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-surface-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Activity Ledger
                  </h3>
                  <p className="text-xs text-surface-500 font-medium">Snapshot of most recent module completions and interactions.</p>
                </div>

                <div className="bg-white border border-border rounded-xl shadow-sm divide-y divide-border">
                  {data.lessonProgress.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-xs text-surface-400 font-bold uppercase tracking-widest text-center">Zero Activity Recorded</p>
                    </div>
                  ) : (
                    data.lessonProgress.map((prog) => (
                      <div key={prog.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded bg-surface-50 border border-border flex items-center justify-center flex-shrink-0 text-surface-400">
                            <Zap className="w-3.5 h-3.5 fill-amber-100 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-surface-900">{prog.lesson.title}</p>
                            <p className="text-[10px] text-surface-400 font-medium">{prog.lesson.course.title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-extrabold text-surface-900 uppercase tracking-widest mb-0.5">Completed</p>
                          <p className="text-[10px] text-surface-500 font-medium">{new Date(prog.completedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
