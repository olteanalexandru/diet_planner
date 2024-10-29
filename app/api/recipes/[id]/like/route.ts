import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const recipeId = id;

    // Create like
    const like = await prisma.recipeLike.create({
      data: {
        userId: session.user.sub,
        recipeId,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: 'recipe_liked',
        userId: session.user.sub,
        recipeId,
      },
    });

    // Get updated like count
    const likeCount = await prisma.recipeLike.count({
      where: { recipeId },
    });

    return NextResponse.json({ likes: likeCount });
  } catch (error) {
    console.error('Error liking recipe:', error);
    return NextResponse.json({ error: 'Error liking recipe' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { recipeId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeId } = params;

    // Delete like
    await prisma.recipeLike.delete({
      where: {
        userId_recipeId: {
          userId: session.user.sub,
          recipeId,
        },
      },
    });

    // Get updated like count
    const likeCount = await prisma.recipeLike.count({
      where: { recipeId },
    });

    return NextResponse.json({ likes: likeCount });
  } catch (error) {
    console.error('Error unliking recipe:', error);
    return NextResponse.json({ error: 'Error unliking recipe' }, { status: 500 });
  }
}