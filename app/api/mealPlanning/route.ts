import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mealPlan = await prisma.mealPlan.findMany({
      where: { userId: session.user.sub },
      include: { recipe: true },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return NextResponse.json({ error: 'Error fetching meal plan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date, recipeId } = await req.json();

    const mealPlan = await prisma.mealPlan.create({
      data: {
        date: new Date(date),
        recipeId,
        userId: session.user.sub,
      },
    });

    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error('Error adding to meal plan:', error);
    return NextResponse.json({ error: 'Error adding to meal plan' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mealPlan } = await req.json();

    // Update meal plan (this is a simplified version, you might want to add more validation)
    for (const meal of mealPlan) {
      await prisma.mealPlan.update({
        where: { id: meal.id },
        data: { date: new Date(meal.date) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating meal plan:', error);
    return NextResponse.json({ error: 'Error updating meal plan' }, { status: 500 });
  }
}