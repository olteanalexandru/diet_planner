import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { Prisma } from '@prisma/client';
import prisma from '../../../lib/db';

const ITEMS_PER_PAGE = 10;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const { category = 'all', sort = 'trending', page = 1, tag = null } = await req.json();

    // Build where clause to match schema fields
    const where: Prisma.RecipeWhereInput = {
      status: 'published', // Match the default value in schema
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

    // Fetch all matching recipes so trending's composite engagement score can be
    // computed and sorted before pagination is applied (DB-level orderBy alone
    // can't express the favorites/comments/viewCount composite).
    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    });

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

    // Sort by engagement score if trending (latest is already ordered by createdAt from the query)
    if (sort === 'trending') {
      transformedRecipes.sort((a, b) => b.engagementScore - a.engagementScore);
    }

    const total = transformedRecipes.length;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const pageRecipes = transformedRecipes.slice(skip, skip + ITEMS_PER_PAGE);

    return NextResponse.json({
      recipes: pageRecipes,
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