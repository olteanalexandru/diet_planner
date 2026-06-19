import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../../../lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check if like already exists
    const existingLike = await prisma.recipeLike.findUnique({
      where: {
        userId_recipeId: {
          userId: session.user.sub,
          recipeId: params.id,
        },
      },
    });

    if (existingLike) {
      const likes = await prisma.recipeLike.count({ where: { recipeId: params.id } });
      return NextResponse.json({
        error: 'Already liked',
        likes
      }, { status: 400 });
    }

    try {
      // Create like and activity in transaction
      await prisma.$transaction([
        prisma.recipeLike.create({
          data: {
            userId: session.user.sub,
            recipeId: params.id,
          },
        }),
        prisma.activity.create({
          data: {
            type: 'recipe_liked',
            userId: session.user.sub,
            recipeId: params.id,
          },
        }),
      ]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const likes = await prisma.recipeLike.count({ where: { recipeId: params.id } });
        return NextResponse.json({ error: 'Already liked', likes }, { status: 400 });
      }
      throw error;
    }

    // Return the up-to-date count
    const likes = await prisma.recipeLike.count({ where: { recipeId: params.id } });
    return NextResponse.json({ likes });
  } catch (error) {
    console.error('Error liking recipe:', error);
    return NextResponse.json(
      { error: 'Failed to like recipe' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await prisma.recipeLike.delete({
        where: {
          userId_recipeId: {
            userId: session.user.sub,
            recipeId: params.id,
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        const likes = await prisma.recipeLike.count({ where: { recipeId: params.id } });
        return NextResponse.json({ error: 'Like not found', likes }, { status: 404 });
      }
      throw error;
    }

    // Return the up-to-date count
    const likes = await prisma.recipeLike.count({ where: { recipeId: params.id } });
    return NextResponse.json({ likes });
  } catch (error) {
    console.error('Error unliking recipe:', error);
    return NextResponse.json(
      { error: 'Failed to unlike recipe' },
      { status: 500 }
    );
  }
}