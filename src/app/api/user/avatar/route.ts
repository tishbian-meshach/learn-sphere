import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('avatar') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ 
                error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' 
            }, { status: 400 });
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ 
                error: 'File too large. Maximum size is 5MB' 
            }, { status: 400 });
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('LearnSphere')
            .upload(filePath, file, {
                upsert: true,
                cacheControl: '3600',
                contentType: file.type,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('LearnSphere')
            .getPublicUrl(uploadData.path);

        // Update user in database
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: publicUrl },
        });

        return NextResponse.json({ 
            avatarUrl: updatedUser.avatarUrl,
            message: 'Avatar updated successfully' 
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user to check if they have an avatar
        const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { avatarUrl: true },
        });

        // Remove avatar URL from database
        await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: null },
        });

        // Optionally delete from storage (if it's not a Google profile picture)
        if (currentUser?.avatarUrl && currentUser.avatarUrl.includes('/avatars/')) {
            const path = currentUser.avatarUrl.split('/avatars/')[1];
            if (path) {
                await supabase.storage
                    .from('LearnSphere')
                    .remove([`avatars/${path}`]);
            }
        }

        return NextResponse.json({ 
            message: 'Avatar removed successfully' 
        });
    } catch (error) {
        console.error('Error removing avatar:', error);
        return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
    }
}
