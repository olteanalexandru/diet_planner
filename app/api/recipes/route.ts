import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, ingredients, instructions, cookingTime, imageUrl } = await req.json();

    // Validate input
    if (!title || !ingredients || !instructions || !cookingTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        ingredients,
        instructions,
        cookingTime: parseInt(cookingTime),
        imageUrl,
        author: { connect: { id: session.user.sub } },
      },
    });

    // Create an activity for the new recipe
    await prisma.activity.create({
      data: {
        action: 'created',
        user: { connect: { id: session.user.sub } },
        recipe: { connect: { id: recipe.id } },
      },
    });

    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ error: 'Error creating recipe' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  try {
    let recipes;
    if (userId) {
      recipes = await prisma.recipe.findMany({
        where: { authorId: userId },
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      recipes = await prisma.recipe.findMany({
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Error fetching recipes' }, { status: 500 });
  }
}