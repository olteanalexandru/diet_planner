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

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            likes: true
          }
        }
      }
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
      return NextResponse.json({ 
        error: 'Already liked',
        likes: recipe._count.likes 
      }, { status: 400 });
    }

    // Create like and activity in transaction
    const [newLike] = await prisma.$transaction([
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

    // Return the updated count (current count + 1)
    return NextResponse.json({ likes: recipe._count.likes + 1 });
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

    // Get current recipe with count
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            likes: true
          }
        }
      }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check if like exists
    const existingLike = await prisma.recipeLike.findUnique({
      where: {
        userId_recipeId: {
          userId: session.user.sub,
          recipeId: params.id,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json({ 
        error: 'Like not found',
        likes: recipe._count.likes 
      }, { status: 404 });
    }

    // Delete like
    await prisma.recipeLike.delete({
      where: {
        userId_recipeId: {
          userId: session.user.sub,
          recipeId: params.id,
        },
      },
    });

    // Return the updated count (current count - 1)
    return NextResponse.json({ likes: recipe._count.likes - 1 });
  } catch (error) {
    console.error('Error unliking recipe:', error);
    return NextResponse.json(
      { error: 'Failed to unlike recipe' },
      { status: 500 }
    );
  }
}