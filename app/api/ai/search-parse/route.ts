import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../../lib/db';
import { canGenerateRecipe, isPremiumUser, recordRecipeGeneration } from '../../../lib/premium';
import { DIET_OPTIONS, TAG_OPTIONS } from '../../../constants';

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

  const { query } = await req.json();
  if (!query || typeof query !== 'string' || !query.trim()) {
    return NextResponse.json({ error: 'A search query is required' }, { status: 400 });
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
          content: `Parse this recipe search request into structured filters: "${query.trim()}".
Allowed tags: ${TAG_OPTIONS.join(', ')}.
Allowed diets: ${DIET_OPTIONS.join(', ')}.
Return only a JSON object with: "title" (a short keyword string for the recipe name/topic, or "" if none), "tags" (array of zero or more values taken only from the allowed tags list above), "diets" (array of zero or more values taken only from the allowed diets list above), and "ingredients" (array of specific ingredient names mentioned or implied, lowercase, or [] if none).`,
        },
      ],
    });

    const content = completion.choices[0].message?.content || '{}';
    if (!isValidJSON(content)) {
      throw new Error('Invalid JSON format from OpenAI');
    }
    const parsed = JSON.parse(content);

    const title = typeof parsed.title === 'string' ? parsed.title : '';
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t: unknown) => typeof t === 'string' && (TAG_OPTIONS as readonly string[]).includes(t))
      : [];
    const diets = Array.isArray(parsed.diets)
      ? parsed.diets.filter((d: unknown) => typeof d === 'string' && (DIET_OPTIONS as readonly string[]).includes(d))
      : [];
    const ingredients = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.filter((i: unknown) => typeof i === 'string' && i.trim())
      : [];

    if (!viewerIsPremium) {
      await recordRecipeGeneration(userId);
    }

    return NextResponse.json({ title, tags, diets, ingredients });
  } catch (error) {
    console.error('Error parsing AI search query:', error);
    return NextResponse.json({ error: 'Failed to parse search query' }, { status: 500 });
  }
}
