
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { recipeId } = await req.json();

    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ viewCount: updatedRecipe.viewCount });

  } catch (error) {
    console.error('Error updating view count:', error);
    return NextResponse.json(
      { error: 'Failed to update view count' },
      { status: 500 }
    );
  }
}