import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/db';
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(
  req: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activityId = params.activityId;

    // Check if like already exists
    const existingLike = await prisma.activityLike.findUnique({
      where: {
        userId_activityId: {
          activityId: activityId,
          userId: session.user.sub
        }
      }
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Activity already liked' },
        { status: 400 }
      );
    }

    // Create like
    await prisma.activityLike.create({
      data: {
        activityId,
        userId: session.user.sub
      }
    });

    // Get updated like count
    const likeCount = await prisma.activityLike.count({
      where: { activityId }
    });

    return NextResponse.json({ likes: likeCount });
  } catch (error) {
    console.error('Error liking activity:', error);
    return NextResponse.json(
      { error: 'Error liking activity' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activityId = params.activityId;

    // Delete like
    await prisma.activityLike.delete({
      where: {
        userId_activityId: {
          activityId: activityId,
          userId: session.user.sub
        }
      }
    });

    // Get updated like count
    const likeCount = await prisma.activityLike.count({
      where: { activityId }
    });

    return NextResponse.json({ likes: likeCount });
  } catch (error) {
    console.error('Error unliking activity:', error);
    return NextResponse.json(
      { error: 'Error unliking activity' },
      { status: 500 }
    );
  }
}
