import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { title, tags, diets, ingredients, page = 1, limit = 12 } = await request.json();

    const skip = (page - 1) * limit;

    const whereConditions: Prisma.RecipeWhereInput = {
      AND: [
        title ? {
          title: {
            contains: title,
            mode: Prisma.QueryMode.insensitive,
          },
        } : undefined,
        tags?.length > 0 ? {
          tags: {
            hasSome: tags
          }
        } : undefined,
        {
          isPublished: true,
        },
        diets?.length > 0 ? {
          dietaryInfo: {
            path: ['diets'],
            array_contains: diets,
          },
        } : undefined,
        ingredients?.length > 0 ? {
          ingredients: {
            hasSome: ingredients
          }
        } : undefined,
      ].filter(Boolean),
    };

    const recipes = await prisma.recipe.findMany({
      where: whereConditions,
      skip,
      take: limit,
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

    const total = await prisma.recipe.count({
      where: whereConditions
    });

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