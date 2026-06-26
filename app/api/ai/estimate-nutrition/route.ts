import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../../lib/db';
import { canGenerateRecipe, isPremiumUser, recordRecipeGeneration } from '../../../lib/premium';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function isValidJSON(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.sub;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ingredients, servings } = await req.json();
  const cleanIngredients = Array.isArray(ingredients)
    ? ingredients.filter((i: unknown) => typeof i === 'string' && i.trim())
    : [];

  if (cleanIngredients.length === 0) {
    return NextResponse.json({ error: 'At least one ingredient is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionStatus: true } });
  const viewerIsPremium = isPremiumUser(user);

  if (!viewerIsPremium) {
    const { allowed, remaining } = await canGenerateRecipe(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Monthly AI usage limit reached. Upgrade to Premium for unlimited AI features.', remaining },
        { status: 403 }
      );
    }
  }

  try {
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
          content: `Estimate the nutrition per serving for a recipe that serves ${servings || 4} and uses these ingredients: ${cleanIngredients.join(
            ', '
          )}. Return only a JSON object with integer "calories", and numeric "protein", "carbs", "fat" (all in grams, per serving).`,
        },
      ],
    });

    const content = completion.choices[0].message?.content || '{}';
    if (!isValidJSON(content)) {
      throw new Error('Invalid JSON format from OpenAI');
    }
    const parsed = JSON.parse(content);

    const calories = Math.max(0, Math.round(Number(parsed.calories) || 0));
    const protein = Math.max(0, Number(parsed.protein) || 0);
    const carbs = Math.max(0, Number(parsed.carbs) || 0);
    const fat = Math.max(0, Number(parsed.fat) || 0);

    if (!viewerIsPremium) {
      await recordRecipeGeneration(userId);
    }

    return NextResponse.json({ calories, protein, carbs, fat });
  } catch (error) {
    console.error('Error estimating nutrition:', error);
    return NextResponse.json({ error: 'Failed to estimate nutrition' }, { status: 500 });
  }
}
