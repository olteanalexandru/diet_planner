import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

// Create PrismaClient singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const comment = await prisma.activityComment.create({
      data: {
        content,
        userId: session.user.sub,
        activityId,
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true
          }
        },
      },
    });

    const commentsCount = await prisma.activityComment.count({
      where: { activityId },
    });

    return NextResponse.json({ 
      comment: {
        ...comment,
        likes: [],
      }, 
      commentsCount 
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Error adding comment' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const session = await getSession();
    const { activityId } = params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 5;

    const comments = await prisma.activityComment.findMany({
      where: { activityId },
      include: {
        user: {
          select: {
            name: true,
            avatar: true
          }
        },
        likes: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.activityComment.count({
      where: { activityId },
    });

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      userName: comment.user.name || '',
      userImage: comment.user.avatar || undefined,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likes: comment.likes.length,
      isLiked: session?.user 
        ? comment.likes.some(like => like.userId === session.user.sub)
        : false
    }));

    return NextResponse.json({
      comments: formattedComments,
      hasMore: total > page * limit,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Error fetching comments' },
      { status: 500 }
    );
  }
}
