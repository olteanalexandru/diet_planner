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
    const orderBy: any = sort === 'trending' 
      ? { viewCount: 'desc' }  // Primary ordering by viewCount for trending
      : { createdAt: 'desc' }; // Default to latest

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
          favorites: session?.user ? {
            where: {
              userId: session.user.sub
            }
          } : false,
          _count: {
            select: {
              comments: true,
              favorites: true,
            }
          },
        }
      }),
      prisma.recipe.count({ where })
    ]);

    // Get additional engagement metrics for trending sort
    let transformedRecipes = recipes.map(recipe => {
      const engagementScore = sort === 'trending'
        ? (recipe._count.favorites * 2) + recipe._count.comments + recipe.viewCount
        : 0;

      return {
        ...recipe,
        isLiked: recipe.favorites?.length > 0,
        engagementScore,
        favorites: undefined, // Remove favorites array from response
      };
    });

    // Sort by engagement score if trending
    if (sort === 'trending') {
      transformedRecipes.sort((a, b) => b.engagementScore - a.engagementScore);
    }

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