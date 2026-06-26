import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../../lib/db';
import { isPremiumUser } from '../../../lib/premium';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.sub } });
  if (!isPremiumUser(user)) {
    return NextResponse.json(
      { error: 'Shopping lists are a Premium feature. Upgrade to unlock this.' },
      { status: 403 }
    );
  }

  try {
    const mealPlan = await prisma.mealPlan.findMany({
      where: { userId: session.user.sub },
      include: { recipe: { select: { title: true, ingredients: true } } },
    });

    const ingredientMap = new Map<string, Set<string>>();
    for (const meal of mealPlan) {
      for (const ingredient of meal.recipe.ingredients) {
        const key = ingredient.trim().toLowerCase();
        if (!key) continue;
        if (!ingredientMap.has(key)) ingredientMap.set(key, new Set());
        ingredientMap.get(key)!.add(meal.recipe.title);
      }
    }

    const items = Array.from(ingredientMap.entries())
      .map(([ingredient, recipeTitles]) => ({
        ingredient,
        recipes: Array.from(recipeTitles),
      }))
      .sort((a, b) => a.ingredient.localeCompare(b.ingredient));

    return NextResponse.json({ items, recipeCount: mealPlan.length });
  } catch (error) {
    console.error('Error building shopping list:', error);
    return NextResponse.json({ error: 'Failed to build shopping list' }, { status: 500 });
  }
}
