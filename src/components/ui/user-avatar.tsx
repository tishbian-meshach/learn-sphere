'use client';

import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { getUserAvatarUrl } from '@/lib/utils';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * UserAvatar component that displays the user's avatar with priority:
 * 1. Google OAuth users: Shows their Google profile picture
 * 2. Users with uploaded avatar: Shows their uploaded profile picture from database
 * 3. Fallback: Shows letter-based avatar with initials from their name
 */
export function UserAvatar({ size = 'md', className }: UserAvatarProps) {
  const { user, profile } = useAuth();

  // Get the appropriate avatar URL with the following priority:
  // 1. Google profile picture (if signed in with Google)
  // 2. Uploaded avatar from database (avatarUrl field)
  // 3. null (triggers letter-based avatar with initials)
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
