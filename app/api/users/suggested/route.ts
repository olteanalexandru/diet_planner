import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/db';
import { getSession } from '@auth0/nextjs-auth0';

interface Follow {
  followingId: string;
}

interface UserWithCounts {
  id: string;
  name: string | null;
  avatar: string | null;
  _count: {
    recipes: number;
    followers: number;
  };
}

interface SuggestedUser {
  id: string;
  name: string | null;
  avatar: string | null;
  recipeCount: number;
  followerCount: number;
}

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get users the current user is already following
    const following = await prisma.follow.findMany({
      where: {
        followerId: session.user.sub
      },
      select: {
        followingId: true
      }
    });

    const followingIds = following.map((f: Follow) => f.followingId);

    // Get users with their recipe and follower counts
    // Exclude the current user and users they're already following
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.sub } },
          { id: { notIn: followingIds } }
        ]
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        _count: {
          select: {
            recipes: true,
            followers: true
          }
        }
      },
      orderBy: [
        { recipes: { _count: 'desc' } },
        { followers: { _count: 'desc' } }
      ],
      take: 5
    });

    const suggestedUsers: SuggestedUser[] = users.map((user: UserWithCounts) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      recipeCount: user._count.recipes,
      followerCount: user._count.followers
    }));

    return NextResponse.json({ users: suggestedUsers });
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    return NextResponse.json(
      { error: 'Error fetching suggested users' },
      { status: 500 }
    );
  }
}
