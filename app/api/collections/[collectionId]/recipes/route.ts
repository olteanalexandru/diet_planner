import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getSession } from '@auth0/nextjs-auth0';

// Add a recipe to a collection
export async function POST(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingCollection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
    });

    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (existingCollection.userId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeId } = await request.json();

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const collectionRecipe = await prisma.collectionRecipe.create({
      data: {
        collectionId: params.collectionId,
        recipeId,
      },
      include: {
        recipe: true,
      },
    });

    return NextResponse.json(collectionRecipe);
  } catch (error) {
    console.error('Error adding recipe to collection:', error);
    return NextResponse.json(
      { error: 'Failed to add recipe to collection' },
      { status: 500 }
    );
  }
}

// Remove a recipe from a collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingCollection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
    });

    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (existingCollection.userId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId');

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    await prisma.collectionRecipe.deleteMany({
      where: {
        collectionId: params.collectionId,
        recipeId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing recipe from collection:', error);
    return NextResponse.json(
      { error: 'Failed to remove recipe from collection' },
      { status: 500 }
    );
  }
}
