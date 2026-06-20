import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../../lib/db';
import { applyPremiumLock, isPremiumUser } from '../../../lib/premium';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const viewer = await prisma.user.findUnique({
      where: { id: session.user.sub },
      select: { subscriptionStatus: true },
    });

    return NextResponse.json({ recipe: applyPremiumLock(recipe, session.user.sub, isPremiumUser(viewer)) });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: { author: true }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.authorId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const {
      title,
      description,
      ingredients,
      instructions,
      cookingTime,
      imageUrl,
      isPublished = true
    } = await req.json();

    const updatedRecipe = await prisma.recipe.update({
      where: { id: params.id },
      data: {
        title,
        description: description || '',
        ingredients,
        instructions,
        cookingTime: parseInt(cookingTime),
        imageUrl,
        isPublished,
        status: isPublished ? 'published' : 'draft',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Create activity for publishing the recipe
    if (isPublished && !recipe.isPublished) {
      await prisma.activity.create({
        data: {
          type: 'published',
          userId: session.user.sub,
          recipeId: recipe.id,
        }
      });
    }

    return NextResponse.json({ recipe: updatedRecipe });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { 
        error: 'Error updating recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.authorId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.recipe.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: { author: true }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.authorId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates = await req.json();
    
    // Validate the status update if provided
    if (updates.status !== undefined && !['draft', 'published'].includes(updates.status)) {
      return NextResponse.json(
        { error: 'Invalid status value. Must be either "draft" or "published"' },
        { status: 400 }
      );
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id: params.id },
      data: {
        ...updates,
        // Ensure status is only updated if explicitly provided
        status: updates.status || recipe.status,
        // Keep isPublished in sync with status so search/feed listings agree
        isPublished: updates.status
          ? updates.status === 'published'
          : recipe.isPublished,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Create activity only when explicitly publishing
    if (updates.status === 'published' && recipe.status !== 'published') {
      await prisma.activity.create({
        data: {
          type: 'published',
          userId: session.user.sub,
          recipeId: recipe.id,
        }
      });
    }

    return NextResponse.json({ recipe: updatedRecipe });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { 
        error: 'Error updating recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
