import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
import axios from 'axios';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      title, 
      description,
      ingredients, 
      instructions, 
      cookingTime,
      prepTime,
      totalTime,
      servings,
      difficulty,
      category,
      cuisine,
      tags,
      dietaryInfo,
      calories,
      protein,
      carbs,
      fat,
      status = 'published',
    } = await req.json();

    if (!title || !ingredients || !instructions || !cookingTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch image from Pexels API
    let imageUrl = '';
    let imageUrlLarge = '';
    try {
      const response = await axios.get(`https://api.pexels.com/v1/search`, {
        params: {
          query: title,
          per_page: 1,
        },
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      imageUrl = response.data.photos[0]?.src?.small || '';
      imageUrlLarge = response.data.photos[0]?.src?.large || '';
    } catch (error) {
      console.error('Error fetching image from Pexels:', error);
      // Continue without image if fetch fails
    }

    // First, ensure the user exists
    let user = await prisma.user.findUnique({
      where: { id: session.user.sub }
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: session.user.sub,
          email: session.user.email || '',
          name: session.user.name || '',
        }
      });
      console.log('Created new user:', user.id);
    }

    // Now create the recipe with all fields including the image URLs
    const recipe = await prisma.recipe.create({
      data: {
        title,
        description: description || '',
        ingredients,
        instructions,
        cookingTime: parseInt(cookingTime),
        prepTime: prepTime ? parseInt(prepTime) : null,
        totalTime: totalTime ? parseInt(totalTime) : null,
        servings: parseInt(servings),
        difficulty,
        category,
        cuisine,
        tags,
        dietaryInfo,
        calories: calories ? parseInt(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fat: fat ? parseFloat(fat) : null,
        imageUrl,
        imageUrlLarge,
        authorId: user.id,
        status,
        isPublished: status === 'published',
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

    // Create activity for the new recipe
    await prisma.activity.create({
      data: {
        type: status === 'published' ? 'created' : 'draft',
        userId: user.id,
        recipeId: recipe.id,
      }
    });

    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { 
        error: 'Error creating recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
