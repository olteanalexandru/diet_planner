import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

const MAX_COMMENT_LENGTH = 500;

export async function PUT(req: NextRequest, { params }: { params: { commentId: string } }) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { commentId } = params;
  const { content } = await req.json();

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check comment length
    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: 'Comment exceeds maximum length' }, { status: 400 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { 
        content,
        updatedAt: new Date(),
      },
      include: { 
        user: true,
        likes: true,
      },
    });

    return NextResponse.json({
      comment: {
        ...updatedComment,
        likes: updatedComment.likes.length,
        isLiked: updatedComment.likes.some((like: { userId: string }) => like.userId === session.user.sub),
        isEdited: updatedComment.createdAt.getTime() !== (updatedComment.updatedAt?.getTime() ?? updatedComment.createdAt.getTime()),
      }
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Error updating comment' }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = params;

    // Verify comment exists and user owns it
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete comment and all associated likes in a transaction
    await prisma.$transaction([
      prisma.commentLike.deleteMany({
        where: { commentId },
      }),
      prisma.comment.delete({
        where: { id: commentId },
      }),
    ]);

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Error deleting comment' },
      { status: 500 }
    );
  }
}