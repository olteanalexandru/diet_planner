import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const followersCount = await prisma.follow.count({
      where: { followingId: session.user.sub },
    });

    const followingCount = await prisma.follow.count({
      where: { followerId: session.user.sub },
    });

    return NextResponse.json({ followersCount, followingCount });
  } catch (error) {
    console.error('Error fetching follow counts:', error);
    return NextResponse.json({ error: 'Error fetching follow counts' }, { status: 500 });
  }
}