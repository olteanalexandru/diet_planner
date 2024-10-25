import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();
export async function POST(
  req: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityId } = params;

    const like = await prisma.activityLike.create({
      data: {
        userId: session.user.sub,
        activityId,
      },
    });

    const likesCount = await prisma.activityLike.count({
      where: { activityId },
    });

    return NextResponse.json({ likes: likesCount });
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

    const { activityId } = params;

    await prisma.activityLike.delete({
      where: {
        userId_activityId: {
          userId: session.user.sub,
          activityId,
        },
      },
    });

    const likesCount = await prisma.activityLike.count({
      where: { activityId },
    });

    return NextResponse.json({ likes: likesCount });
  } catch (error) {
    console.error('Error unliking activity:', error);
    return NextResponse.json(
      { error: 'Error unliking activity' },
      { status: 500 }
    );
  }
}