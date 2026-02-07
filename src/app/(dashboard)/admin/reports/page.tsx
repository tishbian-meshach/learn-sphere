'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    participantName: true,
    courseName: true,
    enrolledDate: false,
    startDate: false,
    timeSpent: false,
    completionPercentage: true,
    completedDate: false,
    status: true,
  });
  const filterRef = useRef<HTMLDivElement>(null);

  const defaultColumns = ['sno', 'participantName', 'courseName', 'completionPercentage', 'status'];

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    if (defaultColumns.includes(column)) return; // Cannot toggle default columns
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const fetchReports = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowColumnFilter(false);
      }
    };

    if (showColumnFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnFilter]);

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

  const handleExportCsv = () => {
    if (!filteredEnrollments || filteredEnrollments.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const columnConfig = [
      { key: 'sno', label: 'S.No.' },
      { key: 'participantName', label: 'Participant Name' },
      { key: 'courseName', label: 'Course Name' },
      { key: 'enrolledDate', label: 'Enrolled Date' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'timeSpent', label: 'Time Spent' },
      { key: 'completionPercentage', label: 'Completion %' },
      { key: 'completedDate', label: 'Completed Date' },
      { key: 'status', label: 'Status' },
    ];

    const activeCols = columnConfig.filter(col => visibleColumns[col.key as keyof typeof visibleColumns]);
    const headers = activeCols.map(col => col.label).join(',');

    const rows = filteredEnrollments.map((e, index) => {
      return activeCols.map(col => {
        let val: any = '';
        switch (col.key) {
          case 'sno': val = index + 1; break;
          case 'participantName': val = e.user.name; break;
          case 'courseName': val = e.course.title; break;
          case 'enrolledDate': val = new Date(e.enrolledAt).toLocaleDateString(); break;
          case 'startDate': val = e.startedAt ? new Date(e.startedAt).toLocaleDateString() : '—'; break;
          case 'timeSpent': 
            const mins = e.timeSpent || 0;
            val = `${Math.floor(mins / 60)}h ${mins % 60}m`;
            break;
          case 'completionPercentage': val = `${Math.round(e.progress)}%`; break;
          case 'completedDate': val = e.completedAt ? new Date(e.completedAt).toLocaleDateString() : '—'; break;
          case 'status': val = e.progress === 100 ? 'CERTIFIED' : e.progress > 0 ? 'IN PROGRESS' : 'NOT STARTED'; break;
        }
        // CSV Escaping
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `performance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-screen-xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Performance Analytics</h1>
          <p className="text-sm text-surface-500">Live monitoring of learner engagement and completion metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
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
             <div className="relative" ref={filterRef}>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowColumnFilter(!showColumnFilter)}
                 leftIcon={<Filter className="w-4 h-4" />}
               >
                 Columns
               </Button>
               {showColumnFilter && (
                 <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-lg shadow-lg z-50 p-3">
                   <div className="space-y-2">
                     <p className="text-xs font-bold text-surface-500 uppercase tracking-widest mb-3">
                       Customize Table
                     </p>
                     <p className="text-[10px] text-surface-400 mb-3">
                       Pick which columns to show/hide
                     </p>
                     {[
                       { key: 'sno', label: 'S.No.' },
                       { key: 'courseName', label: 'Course Name' },
                       { key: 'participantName', label: 'Participant name' },
                       { key: 'completionPercentage', label: 'Completion percentage' },
                       { key: 'status', label: 'Status' },
                       { key: 'enrolledDate', label: 'Enrolled Date' },
                       { key: 'startDate', label: 'Start date' },
                       { key: 'timeSpent', label: 'Time spent' },
                       { key: 'completedDate', label: 'Completed date' },
                     ].map((col) => {
                       const isDefault = defaultColumns.includes(col.key);
                       return (
                         <label
                           key={col.key}
                           className={cn(
                             "flex items-center justify-between py-2 px-2 rounded",
                             !isDefault && "hover:bg-surface-50 cursor-pointer",
                             isDefault && "opacity-60 cursor-not-allowed"
                           )}
                         >
                           <span className="text-sm text-surface-700">{col.label}</span>
                           <input
                             type="checkbox"
                             checked={visibleColumns[col.key as keyof typeof visibleColumns]}
                             onChange={() => toggleColumn(col.key as keyof typeof visibleColumns)}
                             disabled={isDefault}
                             className="w-4 h-4 text-primary border-surface-300 rounded focus:ring-primary disabled:opacity-50"
                           />
                         </label>
                       );
                     })}
                   </div>
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead className="bg-surface-50 border-b border-border">
                <tr>
                   {visibleColumns.sno && <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">S.No.</th>}
                   {visibleColumns.participantName && <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Participant Name</th>}
                   {visibleColumns.courseName && <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Course Name</th>}
                   {visibleColumns.enrolledDate && <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Enrolled Date</th>}
                   {visibleColumns.startDate && <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Start Date</th>}
                   {visibleColumns.timeSpent && <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Time Spent</th>}
                   {visibleColumns.completionPercentage && <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Completion %</th>}
                   {visibleColumns.completedDate && <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Completed Date</th>}
                   {visibleColumns.status && <th className="px-4 py-3 text-[10px] font-bold text-surface-500 uppercase tracking-widest">Status</th>}
                </tr>
             </thead>
             <tbody className="divide-y divide-border">
                {filteredEnrollments?.map((e, index) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                     {visibleColumns.sno && (
                       <td className="px-4 py-4">
                          <p className="text-sm font-medium text-surface-700">{index + 1}</p>
                       </td>
                     )}
                     {visibleColumns.participantName && (
                       <td className="px-4 py-4">
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
                     )}
                     {visibleColumns.courseName && (
                       <td className="px-4 py-4">
                          <p className="text-sm font-bold text-surface-900 truncate max-w-[200px]">{e.course.title}</p>
                       </td>
                     )}
                     {visibleColumns.enrolledDate && (
                       <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-xs text-surface-500 font-medium">
                             {new Date(e.enrolledAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                       </td>
                     )}
                     {visibleColumns.startDate && (
                       <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-xs text-surface-500 font-medium">
                             {e.startedAt ? new Date(e.startedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </p>
                       </td>
                     )}
                     {visibleColumns.timeSpent && (
                       <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-xs text-surface-700 font-semibold">
                             {e.timeSpent ? `${Math.floor(e.timeSpent / 60)}:${(e.timeSpent % 60).toString().padStart(2, '0')}` : '0:00'}
                          </p>
                       </td>
                     )}
                     {visibleColumns.completionPercentage && (
                       <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-extrabold text-surface-700">{Math.round(e.progress)}%</span>
                          </div>
                       </td>
                     )}
                     {visibleColumns.completedDate && (
                       <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-xs text-surface-500 font-medium">
                             {e.completedAt ? new Date(e.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </p>
                       </td>
                     )}
                     {visibleColumns.status && (
                       <td className="px-4 py-4">
                          <Badge variant={e.progress === 100 ? 'success' : e.progress > 0 ? 'primary' : 'default'} size="sm">
                             {e.progress === 100 ? 'CERTIFIED' : e.progress > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
                          </Badge>
                       </td>
                     )}
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
