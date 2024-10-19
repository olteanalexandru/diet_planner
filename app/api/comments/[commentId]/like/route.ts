import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { commentId: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = params;

    const like = await prisma.commentLike.create({
      data: {
        user: { connect: { id: session.user.sub } },
        comment: { connect: { id: commentId } },
      },
    });

    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { likes: true },
    });

    return NextResponse.json({ likes: updatedComment?.likes.length || 0 });
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { commentId: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = params;

    await prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId: session.user.sub,
          commentId: commentId,
        },
      },
    });

    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { likes: true },
    });

    return NextResponse.json({ likes: updatedComment?.likes.length || 0 });
  } catch (error) {
    console.error('Error unliking comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}