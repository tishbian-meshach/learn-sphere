'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@prisma/client';
import {
    User as UserIcon,
    Shield,
    Trash2,
    Save,
    AlertTriangle,
    Loader2,
    Mail,
    Key,
    Upload,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Tabs, TabPanel } from '@/components/ui/tabs'; // Assuming this export exists based on view_file
import { cn } from '@/lib/utils';

interface SettingsViewProps {
    user: Partial<User>;
}

export function SettingsView({ user }: SettingsViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile Form State
    const [name, setName] = useState(user.name || '');
    const [email, setEmail] = useState(user.email || '');
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Password Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Delete Account State
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('File too large. Maximum size is 5MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('/api/user/avatar', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to upload avatar');
            }

            const data = await response.json();
            setAvatarUrl(data.avatarUrl);
            toast.success('Avatar updated successfully');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload avatar');
            setPreviewUrl(null);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setIsUploadingAvatar(true);
        try {
            const response = await fetch('/api/user/avatar', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to remove avatar');
            }

            setAvatarUrl('');
            setPreviewUrl(null);
            toast.success('Avatar removed successfully');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to remove avatar');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            toast.success('Profile updated successfully');
            router.refresh();
        } catch (error) {
            toast.error('Something went wrong');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/user/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password');
            }

            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') {
            toast.error('Please type DELETE to confirm');
            return;
        }

        setIsDeleting(true);

        try {
            const response = await fetch('/api/user', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            toast.success('Account deleted successfully');
            router.push('/sign-in'); // Or landing page
            router.refresh();
        } catch (error) {
            toast.error('Failed to delete account');
            console.error(error);
            setIsDeleting(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile Information', icon: <UserIcon className="w-4 h-4" /> },
        { id: 'security', label: 'Password & Security', icon: <Shield className="w-4 h-4" /> },
        { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="w-4 h-4" /> },
    ];

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-surface-900">Account Settings</h1>
                <p className="text-sm text-surface-500">Manage your profile, security preferences, and account data.</p>
            </div>

            <div className="bg-white rounded-lg border border-border shadow-sm min-h-[500px]">
                <div className="px-6 pt-6">
                    <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                </div>

                <div className="p-6">
                    <TabPanel isActive={activeTab === 'profile'}>
                        <div className="max-w-xl space-y-8">
                            <div className="pb-6 border-b border-border">
                                <h3 className="font-medium text-surface-900 mb-4">Profile Picture</h3>
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-20 h-20 rounded-full object-cover ring-2 ring-white shadow-md"
                                            />
                                        ) : (
                                            <UserAvatar size="xl" className="w-20 h-20 text-xl" />
                                        )}
                                        {isUploadingAvatar && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-surface-600 mb-3">
                                            Upload a Profile Picture
                                        </p>
                                        <div className="flex gap-3">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                disabled={isUploadingAvatar}
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploadingAvatar}
                                                leftIcon={<Upload className="w-4 h-4" />}
                                            >
                                                Upload New
                                            </Button>
                                            {(avatarUrl || previewUrl) && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRemoveAvatar}
                                                    disabled={isUploadingAvatar}
                                                    leftIcon={<X className="w-4 h-4" />}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid gap-6">
                                    <Input
                                        label="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        leftIcon={<UserIcon className="w-4 h-4" />}
                                    />

                                    <Input
                                        label="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        type="email"
                                        leftIcon={<Mail className="w-4 h-4" />}
                                        disabled // Often changing email requires re-verification, keeping it simple for now or enabled if API supports it
                                        hint="Contact support to change your email address due to security policies."
                                    />
                                    {/* If email change is allowed, remove disabled and update hint */}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        isLoading={isLoading}
                                        leftIcon={<Save className="w-4 h-4" />}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </TabPanel>

                    <TabPanel isActive={activeTab === 'security'}>
                        <div className="max-w-xl space-y-8">
                            <div>
                                <h3 className="font-medium text-surface-900 mb-1">Change Password</h3>
                                <p className="text-xs text-surface-500">
                                    Ensure your account is using a long, random password to stay secure.
                                </p>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                <Input
                                    label="Current Password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    leftIcon={<Key className="w-4 h-4" />}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="New Password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        leftIcon={<Key className="w-4 h-4" />}
                                    />

                                    <Input
                                        label="Confirm Password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        leftIcon={<Key className="w-4 h-4" />}
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        isLoading={isLoading}
                                        variant="secondary"
                                        leftIcon={<Shield className="w-4 h-4" />}
                                    >
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </TabPanel>

                    <TabPanel isActive={activeTab === 'danger'}>
                        <div className="max-w-xl space-y-8">
                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex gap-4">
                                <div className="p-2 bg-white rounded-full h-fit text-red-600 shadow-sm">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-red-900">Delete Account Permanently</h3>
                                    <p className="text-sm text-red-700 leading-relaxed">
                                        This action is irreversible. It will permanently delete your account,
                                        remove all your data from our servers, and cancel any active subscriptions.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <label className="text-sm font-medium text-surface-700 block">
                                    To confirm, type <span className="font-bold select-all">DELETE</span> below:
                                </label>
                                <Input
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder="DELETE"
                                    className="max-w-xs"
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleDeleteAccount}
                                    variant="danger"
                                    isLoading={isDeleting}
                                    disabled={deleteConfirmation !== 'DELETE'}
                                    leftIcon={<Trash2 className="w-4 h-4" />}
                                >
                                    Delete My Account
                                </Button>
                            </div>
                        </div>
                    </TabPanel>
                </div>
            </div>
        </div>
    );
}
