
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
    const { content } = await req.json();

    const comment = await prisma.activityComment.create({
      data: {
        content,
        userId: session.user.sub,
        activityId,
      },
      include: {
        user: true,
      },
    });

    const commentsCount = await prisma.activityComment.count({
      where: { activityId },
    });

    return NextResponse.json({ comment, commentsCount });
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
    const { activityId } = params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 5;

    const comments = await prisma.activityComment.findMany({
      where: { activityId },
      include: {
        user: true,
        likes: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.activityComment.count({
      where: { activityId },
    });

    return NextResponse.json({
      comments,
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