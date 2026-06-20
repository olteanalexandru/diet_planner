import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../../lib/db';
import { isPremiumUser } from '../../../lib/premium';

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

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionStatus: true } });
  if (!isPremiumUser(user)) {
    return NextResponse.json(
      { error: 'The AI meal plan generator is a Premium feature. Upgrade to unlock it.' },
      { status: 403 }
    );
  }

  const { days, calorieTarget, dietaryPreference, cuisinePreference } = await req.json();
  const numDays = Math.min(7, Math.max(1, parseInt(days, 10) || 3));

  const constraints = [
    calorieTarget ? `around ${calorieTarget} calories per day` : null,
    dietaryPreference ? `following a ${dietaryPreference} diet` : null,
    cuisinePreference ? `favoring ${cuisinePreference} cuisine` : null,
  ]
    .filter(Boolean)
    .join(', ');

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
          content: `Create a ${numDays}-day meal plan with breakfast, lunch, and dinner for each day${
            constraints ? ', ' + constraints : ''
          }. Return only a JSON object with key "plan", an array of ${numDays} objects each with "day" (number starting at 1) and "meals" (array of objects with "mealType" ['breakfast','lunch','dinner'], "title", "description" (one sentence), "estimatedCalories" (number), and "estimatedCookingTime" (number, in minutes)).`,
        },
      ],
    });

    const content = completion.choices[0].message?.content || '{}';
    if (!isValidJSON(content)) {
      throw new Error('Invalid JSON format from OpenAI');
    }
    const parsed = JSON.parse(content);
    const plan = Array.isArray(parsed.plan) ? parsed.plan : [];

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json({ error: 'Failed to generate meal plan' }, { status: 500 });
  }
}
