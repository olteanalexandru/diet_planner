
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const { id } = params;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            },
            likes: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            favorites: true,
            comments: true,
          }
        },
        favorites: session?.user ? {
          where: {
            userId: session.user.sub,
          }
        } : false,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Track view count
    await prisma.recipe.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // Transform recipe before sending
    const transformedRecipe = {
      ...recipe,
      isLiked: recipe.favorites?.length > 0,
      isOwner: session?.user?.sub === recipe.authorId,
      comments: recipe.comments.map(comment => ({
        ...comment,
        likes: comment.likes.length,
        isLiked: comment.likes.some(like => like.userId === session?.user?.sub),
      })),
      favorites: undefined, // Remove favorites array from response
    };

    return NextResponse.json({ recipe: transformedRecipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
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

    const { id } = params;

    // Check if recipe exists and user owns it
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.authorId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete recipe and related data
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { recipeId: id } }),
      prisma.favorite.deleteMany({ where: { recipeId: id } }),
      prisma.recipe.delete({ where: { id } })
    ]);

    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: 500 }
    );
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

    const { id } = params;
    const data = await req.json();

    // Validate required fields
    const requiredFields = ['title', 'ingredients', 'instructions', 'cookingTime'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check recipe ownership
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.authorId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate total time if prep time is provided
    const totalTime = data.prepTime 
      ? data.cookingTime + data.prepTime 
      : data.cookingTime;

    // Format dietary info
    const dietaryInfo = {
      isVegetarian: data.isVegetarian || false,
      isVegan: data.isVegan || false,
      isGlutenFree: data.isGlutenFree || false,
      isDairyFree: data.isDairyFree || false,
      ...data.dietaryInfo
    };

    // Update recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions,
        cookingTime: parseInt(data.cookingTime),
        servings: parseInt(data.servings) || 4,
        difficulty: data.difficulty || 'medium',
        category: data.category || 'other',
        cuisine: data.cuisine,
        tags: data.tags || [],
        dietaryInfo,
        prepTime: data.prepTime ? parseInt(data.prepTime) : null,
        totalTime,
        calories: data.calories ? parseInt(data.calories) : null,
        protein: data.protein ? parseFloat(data.protein) : null,
        carbs: data.carbs ? parseFloat(data.carbs) : null,
        fat: data.fat ? parseFloat(data.fat) : null,
        imageUrl: data.imageUrl,
        isPublished: data.isPublished ?? true,
        updatedAt: new Date(),
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

    return NextResponse.json({ recipe: updatedRecipe });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}