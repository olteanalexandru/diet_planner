import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../../../lib/db';

async function recomputeRecipeRating(recipeId: string) {
  const aggregate = await prisma.recipeRating.aggregate({
    where: { recipeId },
    _avg: { value: true },
    _count: { value: true },
  });

  await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      rating: aggregate._avg.value || null,
      ratingCount: aggregate._count.value,
    },
  });

  return { rating: aggregate._avg.value || null, ratingCount: aggregate._count.value };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    const [aggregate, userRating] = await Promise.all([
      prisma.recipeRating.aggregate({
        where: { recipeId: params.id },
        _avg: { value: true },
        _count: { value: true },
      }),
      session?.user
        ? prisma.recipeRating.findUnique({
            where: { userId_recipeId: { userId: session.user.sub, recipeId: params.id } },
          })
        : null,
    ]);

    return NextResponse.json({
      rating: aggregate._avg.value || null,
      ratingCount: aggregate._count.value,
      userRating: userRating?.value || null,
    });
  } catch (error) {
    console.error('Error fetching recipe rating:', error);
    return NextResponse.json({ error: 'Failed to fetch rating' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { value } = await req.json();
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return NextResponse.json({ error: 'Rating value must be an integer from 1 to 5' }, { status: 400 });
    }

    const recipe = await prisma.recipe.findUnique({ where: { id: params.id } });
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    await prisma.recipeRating.upsert({
      where: { userId_recipeId: { userId: session.user.sub, recipeId: params.id } },
      create: { userId: session.user.sub, recipeId: params.id, value },
      update: { value },
    });

    const { rating, ratingCount } = await recomputeRecipeRating(params.id);

    return NextResponse.json({ rating, ratingCount, userRating: value });
  } catch (error) {
    console.error('Error rating recipe:', error);
    return NextResponse.json({ error: 'Failed to rate recipe' }, { status: 500 });
  }
}
