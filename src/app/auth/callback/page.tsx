'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const handleCallback = async () => {
            console.log('Auth callback: started');
            try {
                // Handle the code exchange
                const searchParams = new URLSearchParams(window.location.search);
                const code = searchParams.get('code');
                const token_hash = searchParams.get('token_hash');
                const type = searchParams.get('type');

                // Handle email verification/confirmation
                if (token_hash && type) {
                    console.log('Auth callback: verifying email with token_hash');
                    const { error: verifyError } = await supabase.auth.verifyOtp({
                        token_hash,
                        type: type as any,
                    });

                    if (verifyError) {
                        console.error('Auth callback: verification error', verifyError);
                        router.push('/sign-in?error=Email verification failed');
                        return;
                    }
                    console.log('Auth callback: email verified successfully');
                }

                // Handle OAuth code exchange
                if (code) {
                    console.log('Auth callback: exchanging code for session');
                    await supabase.auth.exchangeCodeForSession(code);
                }

                const { data: { session }, error } = await supabase.auth.getSession();
                console.log('Auth callback: session', session?.user?.id);

                if (error) {
                    console.error('Auth callback error:', error);
                    router.push('/sign-in?error=Authentication failed');
                    return;
                }

                if (session?.user) {
                    console.log('Auth callback: user found, checking profile');
                    // Check if user profile exists
                    const res = await fetch(`/api/users/${session.user.id}`);

                    let userData;
                    if (!res.ok) {
                        console.log('Auth callback: profile not found, creating one');
                        const role = searchParams.get('role');
                        console.log('Auth callback: role from params', role);

                        // 2. Create/Update User Profile in our DB
                        console.log('Auth callback: ensuring user profile exists');
                        const userRes = await fetch('/api/users', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: session.user.id,
                                email: session.user.email,
                                name: session.user.user_metadata.full_name || session.user.user_metadata.name,
                                role: role || 'LEARNER', // Use the role from params if available
                                avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
                            }),
                        });

                        if (!userRes.ok) {
                            console.error('Auth callback: failed to sync user profile');
                            router.push('/sign-in?error=Profile sync failed');
                            return;
                        }

                        userData = await userRes.json();
                        console.log('Auth callback: profile created/synced', userData);
                    } else {
                        userData = await res.json();
                        console.log('Auth callback: profile found', userData);
                    }

                    // 3. Final Redirection based on role
                    const finalRole = userData.role || 'LEARNER';
                    console.log('Auth callback: redirecting based on role', finalRole);

                    if (finalRole === 'ADMIN' || finalRole === 'INSTRUCTOR') {
                        router.push('/admin');
                    } else {
                        router.push('/learner/courses');
                    }
                } else {
                    console.log('Auth callback: no user found, back to sign-in');
                    router.push('/sign-in');
                }
            } catch (error) {
                console.error('Callback error:', error);
                router.push('/sign-in?error=Something went wrong');
            }
        };

        handleCallback();
    }, [router, supabase]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-surface-600">Completing sign in...</span>
            </div>
        </div>
    );
}
