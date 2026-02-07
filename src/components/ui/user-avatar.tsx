'use client';

import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { getUserAvatarUrl } from '@/lib/utils';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * UserAvatar component that displays the user's avatar based on their auth provider
 * - Google OAuth users: Shows their Google profile picture
 * - Other users: Shows letter-based avatar with initials from their name
 */
export function UserAvatar({ size = 'md', className }: UserAvatarProps) {
  const { user, profile } = useAuth();

  // Get the appropriate avatar URL based on auth provider
  // Returns null for non-Google users to trigger letter-based avatar
  const avatarUrl = getUserAvatarUrl(user, profile?.avatarUrl);

  return (
    <Avatar
      src={avatarUrl || undefined}
      name={profile?.name || profile?.email || 'User'}
      size={size}
      className={className}
    />
  );
}
