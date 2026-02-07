'use client';

import { useState, Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap,
  BookOpen,
  PieChart,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'courses', label: 'Course Library', icon: BookOpen, href: '/admin/courses', roles: ['ADMIN', 'INSTRUCTOR'] },
  { id: 'reports', label: 'Performance', icon: PieChart, href: '/admin/reports', roles: ['ADMIN', 'INSTRUCTOR'] },
  { id: 'users', label: 'Platform Users', icon: Users, href: '/admin/users', roles: ['ADMIN'] },
  { id: 'settings', label: 'Organization', icon: Settings, href: '/admin/settings', roles: ['ADMIN'] },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
}

export function AdminSidebar({ isCollapsed, setIsCollapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item =>
    profile?.role && item.roles.includes(profile.role)
  );

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
              <span className="font-bold text-surface-900 whitespace-nowrap">LearnSphere</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
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
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1 h-4 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="p-2 border-t border-border bg-slate-50/50">
          <Link href="/admin/profile" className={cn(
            "flex items-center gap-3 p-2 rounded-md",
            !isCollapsed && "bg-white border border-border shadow-sm"
          )}>
            <Avatar src={profile?.avatarUrl || ''} name={profile?.name || ''} size={isCollapsed ? "sm" : "sm"} />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-surface-900 truncate">{profile?.name || 'Administrator'}</p>
                <p className="text-[10px] text-surface-500 font-medium uppercase tracking-[0.05em]">{profile?.role}</p>
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
