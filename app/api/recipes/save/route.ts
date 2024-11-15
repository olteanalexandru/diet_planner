import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.sub;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const recipeData = await req.json();

  // Ensure the recipe is not already saved
  if (!recipeData.id.startsWith('temp-')) {
    return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
  }

  try {
    const stableId = `${recipeData.title.toLowerCase().replace(/\s+/g, '-')}-${uuidv4().slice(0, 8)}`;
    
    const savedRecipe = await prisma.recipe.create({
      data: {
        id: stableId,
        title: recipeData.title,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        cookingTime: recipeData.cookingTime,
        imageUrl: recipeData.imageUrl,
        imageUrlLarge: recipeData.imageUrlLarge,
        status: recipeData.status,
        isPublished: recipeData.isPublished,
        author: { connect: { id: userId } },
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json({ recipe: savedRecipe });
  } catch (error) {
    console.error('Error saving recipe:', error);
    return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 });
  }
}
