import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../../lib/db';
import { isPremiumUser } from '../../../lib/premium';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CANDIDATE_POOL_SIZE = 30;
const RESULT_COUNT = 6;

function isValidJSON(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

const recipeCardSelect = {
  id: true,
  title: true,
  description: true,
  ingredients: true,
  instructions: true,
  cookingTime: true,
  category: true,
  cuisine: true,
  tags: true,
  dietaryInfo: true,
  imageUrl: true,
  imageUrlLarge: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  isPublished: true,
  status: true,
  servings: true,
  difficulty: true,
  viewCount: true,
  ratingCount: true,
  author: { select: { id: true, name: true } },
  _count: { select: { likes: true, comments: true, favorites: true } },
} as const;

export async function GET(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.sub;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionStatus: true } });
  if (!isPremiumUser(user)) {
    return NextResponse.json(
      { error: 'Upgrade to Premium to unlock personalized AI recipe recommendations.' },
      { status: 403 }
    );
  }

  try {
    const [favorites, likes] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        select: { recipeId: true, recipe: { select: { tags: true, category: true, cuisine: true } } },
        take: 50,
      }),
      prisma.recipeLike.findMany({
        where: { userId },
        select: { recipeId: true, recipe: { select: { tags: true, category: true, cuisine: true } } },
        take: 50,
      }),
    ]);

    const tasteRecipes = [...favorites.map(f => f.recipe), ...likes.map(l => l.recipe)];
    const excludeRecipeIds = new Set<string>([
      ...favorites.map(f => f.recipeId),
      ...likes.map(l => l.recipeId),
    ]);

    const tagCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const cuisineCounts = new Map<string, number>();
    for (const recipe of tasteRecipes) {
      recipe.tags?.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
      if (recipe.category) categoryCounts.set(recipe.category, (categoryCounts.get(recipe.category) || 0) + 1);
      if (recipe.cuisine) cuisineCounts.set(recipe.cuisine, (cuisineCounts.get(recipe.cuisine) || 0) + 1);
    }

    const topTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag]) => tag);
    const topCategories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
    const topCuisines = Array.from(cuisineCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);

    const hasTasteSignal = tasteRecipes.length > 0;

    if (!hasTasteSignal) {
      const trending = await prisma.recipe.findMany({
        where: { isPublished: true, authorId: { not: userId } },
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        take: RESULT_COUNT,
        select: recipeCardSelect,
      });

      return NextResponse.json({
        personalized: false,
        recommendations: trending.map(recipe => ({ recipe, reason: 'Trending on Diet Planner' })),
      });
    }

    const candidates = await prisma.recipe.findMany({
      where: {
        isPublished: true,
        authorId: { not: userId },
        id: { notIn: Array.from(excludeRecipeIds) },
        OR: [
          topTags.length ? { tags: { hasSome: topTags } } : undefined,
          topCategories.length ? { category: { in: topCategories } } : undefined,
          topCuisines.length ? { cuisine: { in: topCuisines } } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { createdAt: 'desc' },
      take: CANDIDATE_POOL_SIZE,
      select: recipeCardSelect,
    });

    const pool = candidates.length > 0
      ? candidates
      : await prisma.recipe.findMany({
          where: { isPublished: true, authorId: { not: userId }, id: { notIn: Array.from(excludeRecipeIds) } },
          orderBy: { createdAt: 'desc' },
          take: CANDIDATE_POOL_SIZE,
          select: recipeCardSelect,
        });

    if (pool.length === 0) {
      return NextResponse.json({ personalized: false, recommendations: [] });
    }

    const candidateSummaries = pool.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      category: recipe.category,
      cuisine: recipe.cuisine,
      tags: recipe.tags,
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an API that only returns raw JSON data. You never respond with additional text, explanations, or descriptions.',
        },
        {
          role: 'user',
          content: `A user likes recipes with these tags: ${topTags.join(', ') || 'none'}; categories: ${topCategories.join(', ') || 'none'}; cuisines: ${topCuisines.join(', ') || 'none'}.
Pick up to ${RESULT_COUNT} of the best-matching recipes for this user from this candidate list (JSON array of {id, title, category, cuisine, tags}):
${JSON.stringify(candidateSummaries)}
Return only a JSON object with key "picks": an array of objects with "id" (must be one of the candidate ids above) and "reason" (a short, specific one-sentence reason this recipe fits the user's taste).`,
        },
      ],
    });

    const content = completion.choices[0].message?.content || '{}';
    if (!isValidJSON(content)) {
      throw new Error('Invalid JSON format from OpenAI');
    }
    const parsed = JSON.parse(content);
    const picks = Array.isArray(parsed.picks) ? parsed.picks : [];

    const poolById = new Map(pool.map(recipe => [recipe.id, recipe]));
    const recommendations = picks
      .filter((pick: any) => pick && typeof pick.id === 'string' && poolById.has(pick.id))
      .slice(0, RESULT_COUNT)
      .map((pick: any) => ({
        recipe: poolById.get(pick.id),
        reason: typeof pick.reason === 'string' ? pick.reason : 'Matches your taste',
      }));

    if (recommendations.length === 0) {
      return NextResponse.json({
        personalized: false,
        recommendations: pool.slice(0, RESULT_COUNT).map(recipe => ({ recipe, reason: 'You might like this' })),
      });
    }

    return NextResponse.json({ personalized: true, recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
