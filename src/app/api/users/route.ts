import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/users - Create user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, name, role } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    const user = await prisma.user.create({
      data: {
        id,
        email,
        name,
        role: role || 'LEARNER',
      },
    });

    return NextResponse.json(user, { status: 201 });
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
