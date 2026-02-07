'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Shield,
  Bell,
  Globe,
  Database,
  Mail,
  Smartphone,
  CreditCard,
  Cloud,
  ChevronRight,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const settingsNav = [
  { id: 'organization', label: 'Organization Configuration', icon: Globe, description: 'Branding, timezone, and global identifiers' },
  { id: 'security', label: 'Access Control & Security', icon: Shield, description: 'Authentication protocols and API security' },
  { id: 'notifications', label: 'System Notifications', icon: Bell, description: 'Triggered emails and platform alerts' },
  { id: 'infrastructure', label: 'Data Infrastructure', icon: Database, description: 'External integrations and storage' },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('organization');
  const [isSaving, setIsSaving] = useState(false);

  // Redirect instructors away from this page
  useEffect(() => {
    if (profile && profile.role === 'INSTRUCTOR') {
      toast.error('Unauthorized. Instructors cannot access platform settings.');
      router.push('/admin/courses');
    }
  }, [profile, router]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Configuration synchronized successfully');
    }, 1000);
  };

  return (
    <div className="max-w-screen-xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Platform Architecture
          </h1>
          <p className="text-sm text-surface-500 font-medium">Configure global parameters and system integration protocols.</p>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          leftIcon={<Save className="w-4 h-4" />}
          isLoading={isSaving}
          onClick={handleSave}
        >
           Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-4 space-y-2">
          {settingsNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-start text-left gap-4 p-4 rounded-md border transition-all',
                activeTab === item.id
                  ? 'border-primary bg-primary/[0.02] ring-1 ring-primary shadow-sm'
                  : 'border-border bg-white hover:border-surface-300'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors',
                activeTab === item.id ? 'bg-primary border-primary text-white shadow-sm' : 'bg-surface-50 border-border text-surface-400'
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-extrabold transition-colors mb-0.5',
                  activeTab === item.id ? 'text-surface-900' : 'text-surface-600'
                )}>
                  {item.label}
                </p>
                <p className="text-xs text-surface-400 font-medium leading-tight">
                  {item.description}
                </p>
              </div>
              {activeTab === item.id && <ChevronRight className="w-4 h-4 text-primary ml-auto mt-1" />}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-8">
          <div className="card shadow-none">
            {activeTab === 'organization' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="space-y-1 border-b border-border pb-6">
                   <h3 className="text-base font-extrabold text-surface-900 uppercase tracking-tight">Branding & Identity</h3>
                   <p className="text-xs text-surface-500 font-medium">Maintain a consistent visual presence across the learning environment.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                   <Input 
                     label="Organization Name" 
                     placeholder="LearnSphere Education" 
                     defaultValue="LearnSphere"
                   />
                   <Input 
                     label="Support Contact" 
                     placeholder="ops@organization.com" 
                     defaultValue="admin@learnsphere.com"
                     leftIcon={<Mail className="w-4 h-4" />}
                   />
                   <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider mb-1.5 block">Primary Accent</label>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded border-2 border-primary bg-primary ring-4 ring-primary/10 shadow-sm" />
                         <span className="text-xs font-mono font-bold text-surface-600">#4F46E5</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-1 border-b border-border pt-8 pb-6">
                   <h3 className="text-base font-extrabold text-surface-900 uppercase tracking-tight">Regional Constraints</h3>
                   <p className="text-xs text-surface-500 font-medium">Standardize timeframes and localization preferences.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider mb-1.5 block">Default Timezone</label>
                      <select className="input-field bg-white">
                         <option>Universal Coordinated (UTC)</option>
                         <option>Pacific Standard (PST)</option>
                         <option>Eastern Standard (EST)</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider mb-1.5 block">Primary Currency</label>
                      <select className="input-field bg-white">
                         <option>INR - Indian Rupee (₹)</option>
                         <option>USD - US Dollar ($)</option>
                         <option>EUR - Euro (€)</option>
                      </select>
                   </div>
                </div>
              </div>
            )}

            {activeTab !== 'organization' && (
              <div className="py-24 text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-surface-50 border border-border rounded-full flex items-center justify-center mx-auto grayscale opacity-50">
                  <Settings className="w-8 h-8 text-surface-300" />
                </div>
                <div className="space-y-1">
                   <p className="text-sm font-bold text-surface-900">Module Initializing</p>
                   <p className="text-xs text-surface-500 max-w-xs mx-auto">This configuration subspace is currently being provisioned with the latest system features.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
