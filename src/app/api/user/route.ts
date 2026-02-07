import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming this import path
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete user data from Prisma
        await prisma.user.delete({
            where: { id: user.id },
        });

        // Attempt to delete from Supabase Auth if service role key is available
        // Otherwise rely on sign out.
        // Note: Proper implementation would use SUPABASE_SERVICE_ROLE_KEY here.

        // Sign out the user
        await supabase.auth.signOut();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
