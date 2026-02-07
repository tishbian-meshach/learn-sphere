import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/tags - Get all unique tags used in courses
export async function GET(request: NextRequest) {
  try {
    const tags = await prisma.courseTag.findMany({
      distinct: ['name'],
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(tags.map((t) => t.name));
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
