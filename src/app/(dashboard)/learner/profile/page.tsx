import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { SettingsView } from '@/components/settings/settings-view';

export const dynamic = 'force-dynamic';

export default async function LearnerProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/sign-in');
    }

    const profile = await prisma.user.findUnique({
        where: { id: user.id },
    });

    if (!profile) {
        return <div>User not found</div>;
    }

    return <SettingsView user={profile} />;
}
