
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

const ITEMS_PER_PAGE = 10;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const { category = 'all', sort = 'trending', page = 1 } = await req.json();

    // Build where clause
    let where: any = {};
    if (category !== 'all') {
      where.category = category;
    }

    // Calculate trending score based on recent activity
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Build orderBy based on sort parameter
    let orderBy: any = {};
    if (sort === 'trending') {
      orderBy = [
        {
          favorites: {
            _count: 'desc'
          }
        },
        {
          comments: {
            where: {
              createdAt: {
                gte: oneWeekAgo
              }
            },
            _count: 'desc'
          }
        },
        {
          viewCount: 'desc'
        }
      ];
    } else {
      orderBy = {
        createdAt: 'desc'
      };
    }

    // Fetch recipes with pagination
    const [recipes, total] = await prisma.$transaction([
      prisma.recipe.findMany({
        where,
        orderBy,
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              comments: true,
              favorites: true,
            }
          },
          favorites: session?.user ? {
            where: {
              userId: session.user.sub
            }
          } : false,
        }
      }),
      prisma.recipe.count({ where })
    ]);

    // Transform recipes to include isLiked status
    const transformedRecipes = recipes.map(recipe => ({
      ...recipe,
      isLiked: recipe.favorites?.length > 0,
      favorites: undefined, // Remove favorites array from response
    }));

    return NextResponse.json({
      recipes: transformedRecipes,
      hasMore: total > page * ITEMS_PER_PAGE,
      total
    });

  } catch (error) {
    console.error('Error in recipe feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}