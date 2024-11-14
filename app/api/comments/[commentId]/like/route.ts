import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { commentId } = params;

    const likes = await prisma.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({ likes });
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json({ error: 'Error liking comment' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { commentId } = params;

    await prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId: session.user.sub,
          commentId,
        },
      },
    });

    const likes = await prisma.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({ likes });
  } catch (error) {
    console.error('Error unliking comment:', error);
    return NextResponse.json({ error: 'Error unliking comment' }, { status: 500 });
  }
}