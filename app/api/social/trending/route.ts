import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/db';

interface RecipeWithStats {
  tags: string[];
  _count: {
    likes: number;
    comments: number;
  }
}

interface TagStats {
  count: number;
  engagement: number;
}

interface TrendingTopic {
  tag: string;
  count: number;
  growth: number;
  engagement: number;
}

export async function GET(req: NextRequest) {
  try {
    // Get activities from the last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get all recipes created in the last week
    const recipes = await prisma.recipe.findMany({
      where: {
        createdAt: {
          gte: lastWeek
        }
      },
      select: {
        tags: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    // Calculate tag frequencies and engagement
    const tagStats = new Map<string, TagStats>();
    
    recipes.forEach((recipe: RecipeWithStats) => {
      recipe.tags.forEach((tag: string) => {
        const stats = tagStats.get(tag) || { count: 0, engagement: 0 };
        stats.count += 1;
        stats.engagement += recipe._count.likes + recipe._count.comments;
        tagStats.set(tag, stats);
      });
    });

    // Get previous week's data for growth calculation
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const previousWeekRecipes = await prisma.recipe.findMany({
      where: {
        createdAt: {
          gte: twoWeeksAgo,
          lt: lastWeek
        }
      },
      select: {
        tags: true
      }
    });

    const previousTagCounts = new Map<string, number>();
    previousWeekRecipes.forEach((recipe: { tags: string[] }) => {
      recipe.tags.forEach((tag: string) => {
        previousTagCounts.set(tag, (previousTagCounts.get(tag) || 0) + 1);
      });
    });

    // Calculate growth and format topics
    const topics: TrendingTopic[] = Array.from(tagStats.entries())
      .map(([tag, stats]) => {
        const previousCount = previousTagCounts.get(tag) || 1; // Use 1 to avoid division by zero
        const growth = Math.round(((stats.count - previousCount) / previousCount) * 100);
        
        return {
          tag,
          count: stats.count,
          growth,
          engagement: stats.engagement
        };
      })
      // Sort by engagement and count
      .sort((a, b) => b.engagement - a.engagement || b.count - a.count)
      // Take top 5
      .slice(0, 5);

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { error: 'Error fetching trending topics' },
      { status: 500 }
    );
  }
}
