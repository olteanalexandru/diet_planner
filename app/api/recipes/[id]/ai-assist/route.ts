import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../../../lib/db';
import { isPremiumUser } from '../../../../lib/premium';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ACTION_PROMPTS: Record<string, string> = {
  substitutions:
    'Suggest 3-5 practical ingredient substitutions for this recipe (for common allergies, dietary restrictions, or hard-to-find items).',
  tips: 'Give 3-5 professional chef tips to help cook this recipe perfectly.',
  pairing: 'Suggest 3-5 side dishes, drinks, or desserts that pair well with this recipe.',
};

function isValidJSON(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const userId = session?.user?.sub;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionStatus: true } });
  if (!isPremiumUser(user)) {
    return NextResponse.json(
      { error: 'The AI Chef Assistant is a Premium feature. Upgrade to unlock it.' },
      { status: 403 }
    );
  }

  const { action } = await req.json();
  const prompt = ACTION_PROMPTS[action];
  if (!prompt) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: params.id },
    select: { title: true, ingredients: true, instructions: true, cuisine: true },
  });
  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
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
          content: `Recipe: "${recipe.title}" (cuisine: ${recipe.cuisine || 'unspecified'}). Ingredients: ${recipe.ingredients.join(
            ', '
          )}. Instructions: ${recipe.instructions.join(
            ' '
          )}. ${prompt} Return only a JSON object with a single key "items" containing an array of short strings.`,
        },
      ],
    });

    const content = completion.choices[0].message?.content || '{}';
    if (!isValidJSON(content)) {
      throw new Error('Invalid JSON format from OpenAI');
    }
    const parsed = JSON.parse(content);
    const items = Array.isArray(parsed.items) ? parsed.items.filter((i: unknown) => typeof i === 'string') : [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error generating AI assist:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
