
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { followingId } = await req.json();

    // First check if users exist
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.sub } }),
      prisma.user.findUnique({ where: { id: followingId } })
    ]);

    if (!follower || !following) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create follow relationship and activity
    const [follow, activity] = await prisma.$transaction([
      // Create follow
      prisma.follow.create({
        data: {
          followerId: session.user.sub,
          followingId: followingId,
        },
      }),
      // Create activity with appropriate type
      prisma.activity.create({
        data: {
          type: 'started_following',
          userId: session.user.sub,
          targetUserId: followingId,
        },
      }),
    ]);

    return NextResponse.json({ follow, activity }, { status: 201 });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Error following user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { followingId } = await req.json();

    const [ activity] = await prisma.$transaction([
      // Delete follow
      prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: session.user.sub,
            followingId: followingId,
          },
        },
      }),
      // Create unfollow activity
      prisma.activity.create({
        data: {
          type: 'unfollowed',
          userId: session.user.sub,
          targetUserId: followingId,
        },
      }),
    ]);

    return NextResponse.json({ 
      message: 'Unfollowed successfully',
      activity 
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Error unfollowing user' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const followingId = searchParams.get('followingId');

    if (!followingId) {
      return NextResponse.json({ error: 'Missing followingId parameter' }, { status: 400 });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.sub,
          followingId: followingId,
        },
      },
    });

    return NextResponse.json({ isFollowing: Boolean(follow) });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Error checking follow status' }, { status: 500 });
  }
}