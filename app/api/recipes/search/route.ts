import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { title, tags, diets, ingredients, page = 1, limit = 12 } = await request.json();

    const skip = (page - 1) * limit;

    const whereConditions: Prisma.RecipeWhereInput = {
      AND: [
        title && {
          title: {
            contains: title,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        tags?.length > 0 && {
          tags: {
            hasSome: tags
          }
        },
        {
          isPublished: true,
        },
        diets?.length > 0 && {
          dietaryInfo: {
            path: ['diets'],
            array_contains: diets,
          },
        },
      ].filter(Boolean) as Prisma.RecipeWhereInput[],
    };

    // First fetch recipes without ingredients filter
    let recipes = await prisma.recipe.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Manually filter for ingredients if they exist
    if (ingredients?.length > 0) {
      recipes = recipes.filter(recipe => 
        ingredients.some((ingredient: string) =>
          recipe.ingredients.some(recipeIngredient =>
            recipeIngredient.toLowerCase().includes(ingredient.toLowerCase())
          )
        )
      );
    }

    // Apply pagination after filtering
    const total = recipes.length;
    recipes = recipes.slice(skip, skip + limit);

    return NextResponse.json({
      recipes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search recipes' },
      { status: 500 }
    );
  }
}