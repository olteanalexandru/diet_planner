import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

// Create PrismaClient singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

interface CommentResponse {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

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
            id: true,
            name: true,
            avatar: true
          }
        },
        likes: true,
      },
    });

    const formattedComment: CommentResponse = {
      id: comment.id,
      content: comment.content,
      user: {
        id: comment.user.id,
        name: comment.user.name || '',
        avatar: comment.user.avatar || undefined
      },
      createdAt: comment.createdAt.toISOString(),
      likes: 0,
      isLiked: false
    };

    return NextResponse.json({ 
      comment: formattedComment
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
    const limit = 10;

    const comments = await prisma.activityComment.findMany({
      where: { activityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        likes: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit + 1, // Take one extra to determine if there are more
    });

    const hasMore = comments.length > limit;
    const paginatedComments = comments.slice(0, limit);

    const formattedComments: CommentResponse[] = paginatedComments.map(comment => ({
      id: comment.id,
      content: comment.content,
      user: {
        id: comment.user.id,
        name: comment.user.name || '',
        avatar: comment.user.avatar || undefined
      },
      createdAt: comment.createdAt.toISOString(),
      likes: comment.likes.length,
      isLiked: session?.user 
        ? comment.likes.some(like => like.userId === session.user.sub)
        : false
    }));

    return NextResponse.json({
      comments: formattedComments,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Error fetching comments' },
      { status: 500 }
    );
  }
}
