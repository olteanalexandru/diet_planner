import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

const MAX_COMMENTS = 5;
const MAX_COMMENT_LENGTH = 500;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get('recipeId');

  if (!recipeId) {
    return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { recipeId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId, content } = await req.json();

    // Check comment length
    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: 'Comment exceeds maximum length' }, { status: 400 });
    }

    // Check comment count
    const commentCount = await prisma.comment.count({ where: { recipeId } });
    if (commentCount >= MAX_COMMENTS) {
      return NextResponse.json({ error: 'Maximum number of comments reached' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        recipe: { connect: { id: recipeId } },
        user: { connect: { id: session.user.sub } },
      },
      include: { user: { select: { id: true, name: true } } },
    });

    // Create an activity for the new comment
    await prisma.activity.create({
      data: {
        action: 'commented',
        user: { connect: { id: session.user.sub } },
        recipe: { connect: { id: recipeId } },
      },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Error creating comment' }, { status: 500 });
  }
}