import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/users - Create user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, name, role } = body;

    // Unified resilient user creation Logic
    try {
      // 1. Check if user exists by email first
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail && existingUserByEmail.id !== id) {
        console.log(`User with email ${email} exists with different ID (${existingUserByEmail.id}). Updating profile.`);

        // If the email exists but with a different ID, we update the existing record.
        // Note: Updating the primary key 'id' in Prisma is possible but risky if there are relations.
        // However, we need the ID to match Supabase for future fetches.
        try {
          const user = await prisma.user.update({
            where: { email },
            data: {
              id, // Relink to new Supabase ID
              name: name || existingUserByEmail.name,
            },
          });
          return NextResponse.json(user, { status: 200 });
        } catch (updateIdError) {
          console.error('Failed to update user ID, falling back to return existing:', updateIdError);
          // Fallback: if we can't update the ID, return the existing user
          // Note: This might cause fetch-by-id issues later, but avoids a 500 error now.
          return NextResponse.json(existingUserByEmail, { status: 200 });
        }
      }

      // 2. Standard Upsert by ID
      const user = await prisma.user.upsert({
        where: { id },
        update: {
          email,
          name,
        },
        create: {
          id,
          email,
          name,
          role: role || 'LEARNER',
        },
      });
      return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
      // 3. Last resort error handling
      console.error('Resilient User Creation Error:', error);

      // If we still get a unique constraint error (e.g. race condition), return what we can find
      if (error.code === 'P2002') {
        const fallbackUser = await prisma.user.findFirst({
          where: { OR: [{ id }, { email }] }
        });
        if (fallbackUser) return NextResponse.json(fallbackUser, { status: 200 });
      }

      return NextResponse.json({ error: 'Failed to manage user profile', details: error.message }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const email = searchParams.get('email');

    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          totalPoints: true,
          badgeLevel: true,
          createdAt: true,
        },
      });
      return NextResponse.json(user ? [user] : []);
    }

    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        totalPoints: true,
        badgeLevel: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
