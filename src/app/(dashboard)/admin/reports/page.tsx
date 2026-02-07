'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  PieChart,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  AlertCircle,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

interface ReportData {
  enrollments: any[];
  stats: {
    total: number;
    yetToStart: number;
    inProgress: number;
    completed: number;
  };
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/enrollments?admin=true');
      if (res.ok) {
        const enrollments = await res.json();
        
        // Calculate stats
        const stats = {
          total: enrollments.length,
          yetToStart: enrollments.filter((e: any) => e.progress === 0).length,
          inProgress: enrollments.filter((e: any) => e.progress > 0 && e.progress < 100).length,
          completed: enrollments.filter((e: any) => e.progress === 100).length,
        };

        setData({ enrollments, stats });
      }
    } catch (error) {
      toast.error('Failed to generate audit reports');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEnrollments = data?.enrollments.filter((e) => {
    const matchesSearch = 
      e.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'COMPLETED') return matchesSearch && e.progress === 100;
    if (statusFilter === 'IN_PROGRESS') return matchesSearch && e.progress > 0 && e.progress < 100;
    if (statusFilter === 'NOT_STARTED') return matchesSearch && e.progress === 0;
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Performance Analytics</h1>
          <p className="text-sm text-surface-500">Live monitoring of learner engagement and completion metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
             Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Platform Users', value: data?.stats.total, icon: Users, color: 'text-primary' },
          { label: 'Uninitialized', value: data?.stats.yetToStart, icon: Clock, color: 'text-surface-400' },
          { label: 'Active Learners', value: data?.stats.inProgress, icon: PieChart, color: 'text-amber-500' },
          { label: 'Certified', value: data?.stats.completed, icon: CheckCircle2, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 flex flex-col justify-between border-border shadow-none bg-white">
            <div className="flex items-start justify-between">
               <p className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider">{stat.label}</p>
               <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <p className="text-2xl font-extrabold text-surface-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="card p-0 shadow-none overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-sm">
             <Input
               placeholder="Search metadata..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               leftIcon={<Search className="w-4 h-4" />}
               className="h-9"
             />
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-surface-500 uppercase tracking-widest whitespace-nowrap">Status:</span>
             <Select
               value={statusFilter}
               onChange={setStatusFilter}
               className="h-9 w-40"
               options={[
                 { value: 'ALL', label: 'All Sessions' },
                 { value: 'COMPLETED', label: 'Completed' },
                 { value: 'IN_PROGRESS', label: 'In Progress' },
                 { value: 'NOT_STARTED', label: 'Not Started' },
               ]}
             />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead className="bg-surface-50 border-b border-border">
                <tr>
                   <th className="px-6 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Learner Entity</th>
                   <th className="px-6 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Target Resource</th>
                   <th className="px-6 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Progress Ratio</th>
                   <th className="px-6 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Last Activity</th>
                   <th className="px-6 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Lifecycle</th>
                   <th className="px-6 py-3 text-right"></th>
                </tr>
             </thead>
             <tbody className="divide-y divide-border">
                {filteredEnrollments?.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 border border-border flex items-center justify-center text-[10px] font-bold uppercase text-surface-600">
                              {e.user.name?.slice(0, 2)}
                           </div>
                           <div className="min-w-0">
                              <p className="text-sm font-bold text-surface-900 truncate">{e.user.name}</p>
                              <p className="text-[10px] text-surface-400 truncate">{e.user.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <p className="text-sm font-bold text-surface-900 truncate max-w-[200px]">{e.course.title}</p>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3 w-32">
                           <Progress value={e.progress} size="sm" className="bg-surface-100" />
                           <span className="text-xs font-extrabold text-surface-700">{Math.round(e.progress)}%</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <p className="text-xs text-surface-500 font-medium">{new Date(e.updatedAt).toLocaleDateString()}</p>
                     </td>
                     <td className="px-6 py-4">
                        <Badge variant={e.progress === 100 ? 'success' : e.progress > 0 ? 'primary' : 'default'} size="sm">
                           {e.progress === 100 ? 'CERTIFIED' : e.progress > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
                        </Badge>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon-sm">
                           <MoreHorizontal className="w-4 h-4 text-surface-400" />
                        </Button>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
