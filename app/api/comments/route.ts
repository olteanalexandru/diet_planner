import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId, content } = await req.json();

    // First create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        user: { connect: { id: session.user.sub } },
        recipe: { connect: { id: recipeId } },
      },
      include: {
        user: {
          select: { id: true, name: true }
        },
        likes: true
      },
    });

    // Then create the activity with the correct 'type' field
    await prisma.activity.create({
      data: {
        type: 'commented', // Changed from 'action' to 'type'
        userId: session.user.sub,
        recipeId,
      },
    });

    return NextResponse.json({
      comment: {
        ...comment,
        likes: 0,
        isLiked: false,
      }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Error creating comment' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get('recipeId');

  if (!recipeId) {
    return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
  }

  try {
    const session = await getSession();
    const userId = session?.user?.sub;

    const comments = await prisma.comment.findMany({
      where: { recipeId },
      include: {
        user: {
          select: { id: true, name: true }
        },
        likes: true
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedComments = comments.map(comment => ({
      ...comment,
      likes: comment.likes.length,
      isLiked: userId ? comment.likes.some(like => like.userId === userId) : false,
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 });
  }
}