'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Role } from '@prisma/client';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
  totalPoints: number;
  badgeLevel: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, role?: Role) => Promise<{ error: Error | null }>;
  signInWithGoogle: (role?: Role) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // 1️⃣ Check if account exists
      const checkRes = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      if (checkRes.ok) {
        const users = await checkRes.json();
        if (!users || users.length === 0) {
          return { error: new Error('No account found with this email. Please sign up first.') };
        }
      }

      // 2️⃣ & 3️⃣ Attempt sign-in (checks password and email verification)
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Email not verified
        if (error.message.includes('Email not confirmed')) {
          return { error: new Error('Your email is not verified. Please verify your email to continue.') };
        }
        // Incorrect password (we already verified the account exists)
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Incorrect password. Please try again.') };
        }
        // Other errors
        return { error: error as Error };
      }

      // ✅ Successful login
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: Role = 'LEARNER') => {
    try {
      // 1. Check if user already exists in our Prisma DB
      const checkRes = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      if (checkRes.ok) {
        const users = await checkRes.json();
        if (users && users.length > 0) {
          return { error: new Error('An account with this email already exists. Please sign in instead.') };
        }
      }

      // 2. Proceed with Supabase sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role }
        }
      });

      if (!error && data.user) {
        // Create user profile in database
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            email,
            name,
            role,
          }),
        });
      }

      return { error: error as Error | null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error | null };
    }
  };

  const signInWithGoogle = async (role?: Role) => {
    const redirectTo = new URL(`${window.location.origin}/auth/callback`);
    if (role) {
      redirectTo.searchParams.set('role', role);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo.toString(),
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signIn, signUp, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
