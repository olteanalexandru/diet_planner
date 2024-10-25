
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const { id } = params;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            },
            likes: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            favorites: true,
            comments: true,
          }
        },
        favorites: session?.user ? {
          where: {
            userId: session.user.sub,
          }
        } : false,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Track view count
    await prisma.recipe.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // Transform recipe before sending
    const transformedRecipe = {
      ...recipe,
      isLiked: recipe.favorites?.length > 0,
      isOwner: session?.user?.sub === recipe.authorId,
      comments: recipe.comments.map(comment => ({
        ...comment,
        likes: comment.likes.length,
        isLiked: comment.likes.some(like => like.userId === session?.user?.sub),
      })),
      favorites: undefined, // Remove favorites array from response
    };

    return NextResponse.json({ recipe: transformedRecipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
}