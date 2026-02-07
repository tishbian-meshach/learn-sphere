'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  User as UserIcon,
  Plus,
  ArrowUpDown,
  UserCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
  totalPoints: number;
  badgeLevel: string;
  createdAt: string;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect instructors away from this page
  useEffect(() => {
    if (profile && profile.role === 'INSTRUCTOR') {
      toast.error('Unauthorized. Instructors cannot access platform user management.');
      router.push('/admin/courses');
    }
  }, [profile, router]);

  useEffect(() => {
    if (profile?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [profile]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else if (res.status === 403) {
        toast.error('Unauthorized access');
        router.push('/admin/courses');
      }
    } catch (error) {
      toast.error('Failed to load user registry');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="error" size="sm" className="font-extrabold uppercase tracking-wider text-[10px]">Administrator</Badge>;
      case 'INSTRUCTOR':
        return <Badge variant="primary" size="sm" className="font-extrabold uppercase tracking-wider text-[10px]">Instructor</Badge>;
      default:
        return <Badge variant="outline" size="sm" className="font-extrabold uppercase tracking-wider text-[10px]">Learner</Badge>;
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Platform Governance
          </h1>
          <p className="text-sm text-surface-500 font-medium">Manage user permissions, roles, and organizational access.</p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
           Provision User
        </Button>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="flex-1 max-w-sm">
           <Input
             placeholder="Search by name, email, or identifier..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             leftIcon={<Search className="w-4 h-4" />}
             className="bg-white"
           />
        </div>
        <Button variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[10px]" leftIcon={<Filter className="w-4 h-4" />}>
           Filters
        </Button>
      </div>

      {/* User Table */}
      <div className="bg-white border border-border shadow-sm rounded-md overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-surface-50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-[10px] font-extrabold text-surface-500 uppercase tracking-wider">Identity</th>
              <th className="px-6 py-3 text-[10px] font-extrabold text-surface-500 uppercase tracking-wider">Authorization</th>
              <th className="px-6 py-3 text-[10px] font-extrabold text-surface-500 uppercase tracking-wider">Performance</th>
              <th className="px-6 py-3 text-[10px] font-extrabold text-surface-500 uppercase tracking-wider">Registration</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                   <td className="px-6 py-4"><div className="h-10 w-48 bg-surface-100 rounded" /></td>
                   <td className="px-6 py-4"><div className="h-6 w-24 bg-surface-100 rounded" /></td>
                   <td className="px-6 py-4"><div className="h-6 w-20 bg-surface-100 rounded" /></td>
                   <td className="px-6 py-4"><div className="h-6 w-32 bg-surface-100 rounded" /></td>
                   <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-surface-100 rounded ml-auto" /></td>
                </tr>
              ))
             ) : filteredUsers.length === 0 ? (
               <tr>
                 <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-12 h-12 bg-surface-50 border border-border rounded-full flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-surface-300" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm font-bold text-surface-900">Zero matches found</p>
                          <p className="text-xs text-surface-500">Refine your criteria or check the global registry.</p>
                       </div>
                    </div>
                 </td>
               </tr>
             ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatarUrl || ''} name={user.name || ''} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-surface-900 truncate group-hover:text-primary transition-colors">{user.name || 'Incognito User'}</p>
                        <p className="text-[10px] text-surface-500 lowercase font-mono">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-extrabold text-surface-700">{user.totalPoints} <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider ml-0.5">Pts</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-surface-500 uppercase tracking-widest leading-none">
                     {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu trigger={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button>}>
                       <DropdownMenuItem><UserIcon className="w-4 h-4 mr-2" /> View Dossier</DropdownMenuItem>
                       <DropdownMenuItem><Shield className="w-4 h-4 mr-2" /> Adjust Authorization</DropdownMenuItem>
                       <DropdownMenuItem className="text-destructive"><Plus className="w-4 h-4 mr-2 rotate-45" /> Terminate Access</DropdownMenuItem>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
