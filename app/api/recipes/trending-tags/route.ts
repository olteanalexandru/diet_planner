import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all recipes from the last 30 days with their tags
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recipes = await prisma.recipe.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        tags: true,
        viewCount: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    // Calculate tag frequency and engagement
    const tagStats = new Map<string, { count: number; engagement: number }>();

    recipes.forEach(recipe => {
      const engagement = recipe.viewCount + (recipe._count.likes * 2) + (recipe._count.comments * 3);
      
      recipe.tags.forEach(tag => {
        const current = tagStats.get(tag) || { count: 0, engagement: 0 };
        tagStats.set(tag, {
          count: current.count + 1,
          engagement: current.engagement + engagement
        });
      });
    });

    // Convert to array and sort by engagement
    const trendingTags = Array.from(tagStats.entries())
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        engagement: stats.engagement
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10) // Get top 10 tags
      .map(({ tag, count }) => ({ tag, count })); // Remove engagement from response

    return NextResponse.json({ tags: trendingTags });
  } catch (error) {
    console.error('Error fetching trending tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending tags' },
      { status: 500 }
    );
  }
}