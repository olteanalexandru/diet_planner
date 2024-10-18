
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { followingId } = await req.json();

    const follow = await prisma.follow.create({
      data: {
        follower: { connect: { id: session.user.sub } },
        following: { connect: { id: followingId } },
      },
    });

    return NextResponse.json({ follow }, { status: 201 });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Error following user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { followingId } = await req.json();

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.sub,
          followingId: followingId,
        },
      },
    });

    return NextResponse.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Error unfollowing user' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const followingId = searchParams.get('followingId');

  if (!followingId) {
    return NextResponse.json({ error: 'Missing followingId parameter' }, { status: 400 });
  }

  try {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.sub,
          followingId: followingId,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Error checking follow status' }, { status: 500 });
  }
}