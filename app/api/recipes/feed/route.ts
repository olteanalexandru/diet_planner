import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();
const ITEMS_PER_PAGE = 10;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const { category = 'all', sort = 'trending', page = 1, tag = null } = await req.json();

    // Build where clause to match schema fields
    const where: any = {
      status: 'published', // Match the default value in schema
      isPublished: true,
    };

    // Add optional filters
    if (category !== 'all') {
      where.category = category;
    }
    if (tag) {
      where.tags = {
        has: tag
      };
    }

    // Debug log to check the query
    console.log('Recipe query:', {
      where,
      orderBy: sort === 'trending' ? { viewCount: 'desc' } : { createdAt: 'desc' },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    });

    // Calculate trending score based on recent activity
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Build orderBy based on sort parameter
    const orderBy: any = sort === 'trending' 
      ? { viewCount: 'desc' }
      : { createdAt: 'desc' };

    // Fetch recipes with likes count and user's like status
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
          likes: session?.user ? {
            where: {
              userId: session.user.sub
            },
            select: {
              userId: true
            }
          } : false,
          _count: {
            select: {
              comments: true,
              favorites: true,
              likes: true // Added likes count
            }
          },
        }
      }),
      prisma.recipe.count({ where })
    ]);

    // Transform recipes to include like status and counts
    const transformedRecipes = recipes.map(recipe => {
      const engagementScore = sort === 'trending'
        ? (recipe._count.favorites * 2) + recipe._count.comments + recipe.viewCount
        : 0;

      return {
        ...recipe,
        isLiked: recipe.likes?.length > 0,
        _count: {
          ...recipe._count,
          likes: recipe._count.likes || 0
        },
        likes: undefined, // Remove likes array from response
        engagementScore,
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