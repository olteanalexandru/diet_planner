import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { recipeId: string } }) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { recipeId } = params;
  const { title, ingredients, instructions, cookingTime } = await req.json();

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { author: true },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.authorId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        title,
        ingredients,
        instructions,
        cookingTime: parseInt(cookingTime),
      },
      include: { author: true },
    });

    return NextResponse.json({ recipe: updatedRecipe });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json({ error: 'Error updating recipe' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { recipeId: string } }) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { recipeId } = params;

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { author: true },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.authorId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete related records first
    await prisma.favorite.deleteMany({ where: { recipeId } });
    await prisma.mealPlan.deleteMany({ where: { recipeId } });
    await prisma.activity.deleteMany({ where: { recipeId } });
    await prisma.comment.deleteMany({ where: { recipeId } });

    // Then delete the recipe
    await prisma.recipe.delete({ where: { id: recipeId } });

    return NextResponse.json({ message: 'Recipe deleted successfully' + recipeId });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Error deleting recipe' }, { status: 500 });
  }
}