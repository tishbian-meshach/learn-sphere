'use client';

import { useState, Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap,
  Compass,
  BookOpen,
  PieChart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { cn, getNextBadgeProgress } from '@/lib/utils';

const navItems = [
  { id: 'browse', label: 'Explore Catalog', icon: Compass, href: '/learner/courses' },
  { id: 'my-courses', label: 'My Learning', icon: BookOpen, href: '/learner/my-courses' }];

interface LearnerSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
}

export function LearnerSidebar({ isCollapsed, setIsCollapsed }: LearnerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const nextBadge = getNextBadgeProgress(profile?.badgePoints || 0);
  const badgeProgress = ((profile?.badgePoints || 0) / 120) * 100;

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-surface-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-border transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded bg-primary flex-shrink-0 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-surface-900 whitespace-nowrap tracking-tight">LearnSphere</span>
            )}
          </Link>
        </div>

        {/* Stats Card (Learner Specific) */}
        {!isCollapsed && (
          <div className="mx-3 my-4 space-y-3">
             {/* Quiz XP */}
             <div className="p-3 bg-slate-50 border border-border rounded-md">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-1.5">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-surface-500">Quiz Knowledge (XP)</span>
                   </div>
                   <span className="text-xs font-black text-surface-900">{profile?.totalPoints}</span>
                </div>
             </div>

             {/* Badge Progression */}
             <div className="p-3 bg-primary/[0.03] border border-primary/10 rounded-md">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3 text-primary" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Badge Points</span>
                   </div>
                   <span className="text-xs font-black text-primary">{profile?.badgePoints}/120</span>
                </div>
                <div className="space-y-1.5">
                   <div className="flex justify-between text-[9px] font-bold text-surface-400">
                      <span>{profile?.badgeLevel}</span>
                      <span>{nextBadge.next}</span>
                   </div>
                   <Progress value={badgeProgress} size="sm" className="bg-primary/10" />
                   <p className="text-[8px] font-medium text-surface-400 italic">
                      {profile?.completedCourses || 0} Courses Certified
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-surface-100 text-primary'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                )}
              >
                <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary' : 'text-surface-400')} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="p-2 border-t border-border bg-slate-50/50">
          <Link href="/learner/profile" className={cn(
            "flex items-center gap-3 p-2 rounded-md",
            !isCollapsed && "bg-white border border-border shadow-sm"
          )}>
            <Avatar src={profile?.avatarUrl || ''} name={profile?.name || ''} size="sm" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-surface-900 truncate">{profile?.name || 'Learner'}</p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="primary" size="sm" className="px-1 py-0">{profile?.badgeLevel}</Badge>
                </div>
              </div>
            )}
          </Link>
          <button
            onClick={handleSignOut}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-md text-xs font-semibold text-destructive hover:bg-destructive/5 transition-colors',
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-border rounded-full items-center justify-center text-surface-400 hover:text-surface-700 shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  );
}
