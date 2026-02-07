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
import { Select } from '@/components/ui/select';
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
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedPerformance, setSelectedPerformance] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Provisioning State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'LEARNER' as 'ADMIN' | 'INSTRUCTOR' | 'LEARNER'
  });

  // Confirmation State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    userId: string | null;
  }>({
    isOpen: false,
    title: '',
    description: '',
    userId: null,
  });

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

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const toastId = toast.loading('Re-authorizing user...');
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success('Authorization updated', { id: toastId });
        fetchUsers();
      } else {
        toast.error('Transition failed', { id: toastId });
      }
    } catch (error) {
      toast.error('Synchronization error', { id: toastId });
    }
  };

  const handleTerminateAccess = (user: User) => {
    setConfirmModal({
      isOpen: true,
      title: 'Terminate User Access',
      description: `You are about to permanently expunge the record for ${user.name || user.email}. This will delete all associated course progress, certifications, and points. This action is IRREVERSIBLE.`,
      userId: user.id
    });
  };

  const confirmTermination = async () => {
    if (!confirmModal.userId) return;

    const toastId = toast.loading('Terminating access...');
    try {
      const res = await fetch(`/api/users/${confirmModal.userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Access terminated', { id: toastId });
        setConfirmModal({ ...confirmModal, isOpen: false });
        fetchUsers();
      } else {
        toast.error('Termination failed', { id: toastId });
      }
    } catch (error) {
      toast.error('Operational error', { id: toastId });
    }
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionForm.email) return toast.error('Email address required');

    setIsProvisioning(true);
    const toastId = toast.loading('Provisioning user account...');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...provisionForm, provision: true }),
      });
      if (res.ok) {
        toast.success('User provisioned. Access will be linked on first authentication.', { id: toastId });
        setIsProvisionModalOpen(false);
        setProvisionForm({ email: '', name: '', password: '', role: 'LEARNER' });
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Provisioning failed', { id: toastId });
      }
    } catch (error) {
      toast.error('Connectivity issue during provisioning', { id: toastId });
    } finally {
      setIsProvisioning(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === 'all' || u.role === selectedRole;

    let matchesPerformance = true;
    if (selectedPerformance !== 'all') {
      const points = u.totalPoints;
      switch (selectedPerformance) {
        case 'zero': matchesPerformance = points === 0; break;
        case 'emerging': matchesPerformance = points > 0 && points <= 40; break;
        case 'proficient': matchesPerformance = points > 40 && points <= 80; break;
        case 'expert': matchesPerformance = points > 80; break;
      }
    }

    return matchesSearch && matchesRole && matchesPerformance;
  });

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
        <Button 
          variant="primary" 
          size="md" 
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsProvisionModalOpen(true)}
        >
          Provision User
        </Button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search by name, email, or identifier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="bg-white"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            className="font-bold uppercase tracking-widest text-[10px]"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          {(selectedRole !== 'all' || selectedPerformance !== 'all' || searchQuery !== '') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedRole('all');
                setSelectedPerformance('all');
                setSearchQuery('');
              }}
              className="text-surface-500 hover:text-primary font-bold uppercase tracking-widest text-[10px]"
            >
              Clear All
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-50 border border-border rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <Select
              label="Filter by Authorization"
              value={selectedRole}
              onChange={setSelectedRole}
              options={[
                { label: 'All Roles', value: 'all' },
                { label: 'Administrator', value: 'ADMIN' },
                { label: 'Instructor', value: 'INSTRUCTOR' },
                { label: 'Learner', value: 'LEARNER' },
              ]}
            />
            <Select
              label="Filter by Performance"
              value={selectedPerformance}
              onChange={setSelectedPerformance}
              options={[
                { label: 'All Performance', value: 'all' },
                { label: 'Baseline (0 Pts)', value: 'zero' },
                { label: 'Emerging (1-40 Pts)', value: 'emerging' },
                { label: 'Proficient (41-80 Pts)', value: 'proficient' },
                { label: 'High Achiever (81+ Pts)', value: 'expert' },
              ]}
            />
          </div>
        )}
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
                      <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                        <UserIcon className="w-4 h-4 mr-2" /> View Dossier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(user.id, user.role === 'LEARNER' ? 'INSTRUCTOR' : 'LEARNER')}>
                        <Shield className="w-4 h-4 mr-2" /> 
                        {user.role === 'LEARNER' ? 'Promote to Instructor' : 'Demote to Learner'}
                      </DropdownMenuItem>
                      {user.role !== 'ADMIN' && (
                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'ADMIN')} className="text-amber-600">
                          <Shield className="w-4 h-4 mr-2" /> Grant Admin Rights
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleTerminateAccess(user)} className="text-destructive">
                        <Plus className="w-4 h-4 mr-2 rotate-45" /> Terminate Access
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Provision User Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-[2px]" onClick={() => !isProvisioning && setIsProvisionModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-slate-50/50">
               <h2 className="text-sm font-extrabold text-surface-900 uppercase tracking-widest flex items-center gap-2">
                 <Shield className="w-4 h-4 text-primary" /> User Provisioning Wizard
               </h2>
               <p className="text-[10px] text-surface-500 font-medium uppercase tracking-wider mt-1">Pre-authorize platform access for new practitioners.</p>
            </div>
            
            <form onSubmit={handleProvisionUser} className="p-6 space-y-4">
              <Input
                label="Identity (Full Name)"
                placeholder="e.g. Dr. Julian Vester"
                value={provisionForm.name}
                onChange={(e) => setProvisionForm({ ...provisionForm, name: e.target.value })}
                disabled={isProvisioning}
              />
              <Input
                label="Electronic Mail"
                type="email"
                placeholder="practitioner@learnsphere.io"
                value={provisionForm.email}
                onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
                required
                disabled={isProvisioning}
              />
              <Input
                label="Initial Password"
                type="password"
                placeholder="••••••••"
                value={provisionForm.password}
                onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                required
                disabled={isProvisioning}
                hint="Credentials required for the user's first login."
              />
              <Select
                label="Authorization Tier"
                value={provisionForm.role}
                onChange={(val) => setProvisionForm({ ...provisionForm, role: val as any })}
                options={[
                  { label: 'Platform Learner', value: 'LEARNER' },
                  { label: 'Course Instructor', value: 'INSTRUCTOR' },
                  { label: 'System Administrator', value: 'ADMIN' },
                ]}
              />
              
              <div className="pt-4 flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1" 
                  onClick={() => setIsProvisionModalOpen(false)}
                  disabled={isProvisioning}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1" 
                  isLoading={isProvisioning}
                >
                  Confirm Provision
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-[4px] animate-in fade-in duration-300" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} />
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-black text-surface-900 uppercase tracking-tight">{confirmModal.title}</h3>
                <p className="text-xs text-surface-500 font-medium leading-relaxed">{confirmModal.description}</p>
              </div>
            </div>
            <div className="flex border-t border-border">
              <button 
                className="flex-1 px-4 py-3 text-xs font-bold text-surface-500 hover:bg-surface-50 transition-colors uppercase tracking-widest border-r border-border"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-4 py-3 text-xs font-bold text-destructive hover:bg-destructive/5 transition-colors uppercase tracking-widest"
                onClick={confirmTermination}
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
