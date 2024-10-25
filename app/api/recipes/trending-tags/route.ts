
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get recipes from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recipes = await prisma.recipe.findMany({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      },
      select: {
        tags: true,
        favorites: {
          select: {
            createdAt: true
          }
        },
        comments: {
          select: {
            createdAt: true
          }
        }
      }
    });

    // Calculate tag popularity based on recipe engagement
    const tagScores = new Map<string, number>();

    recipes.forEach(recipe => {
      const engagementScore = 
        recipe.favorites.length * 2 + // Likes worth 2 points
        recipe.comments.length * 3;   // Comments worth 3 points

      recipe.tags.forEach(tag => {
        const currentScore = tagScores.get(tag) || 0;
        tagScores.set(tag, currentScore + engagementScore + 1); // +1 for base tag usage
      });
    });

    // Convert to array and sort by score
    const trendingTags = Array.from(tagScores.entries())
      .map(([tag, score]) => ({
        tag,
        score,
        count: recipes.filter(r => r.tags.includes(tag)).length
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ tag, count }) => ({ tag, count }));

    return NextResponse.json({ tags: trendingTags });

  } catch (error) {
    console.error('Error fetching trending tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending tags' },
      { status: 500 }
    );
  }
}