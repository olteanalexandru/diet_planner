import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';
import { Recipe } from './../../types';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

function isValidJSON(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function normalizeTitle(title: string) {
  return decodeURIComponent(title)
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { title, cookingTime, imageUrl } = requestBody;

  if (!title || !cookingTime) {
    return NextResponse.json({ error: 'Missing title or cookingTime in request body' }, { status: 400 });
  }

  const normalisedTitle = normalizeTitle(title);

  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      // Ensure the user exists in the database
      let user = await prisma.user.findUnique({
        where: { id: session.user.sub },
      });

      if (!user) {
        // Create the user if they don't exist
        user = await prisma.user.create({
          data: {
            id: session.user.sub,
            email: session.user.email || '',
            name: session.user.name || '',
          },
        });
      }

      // Check if the recipe already exists in the database
      let recipe = await prisma.recipe.findFirst({
        where: {
          title: { equals: normalisedTitle, mode: 'insensitive' },
          cookingTime: parseInt(cookingTime),
        },
        include: {
          author: true,
          comments: {
            include: {
              user: true,
              likes: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!recipe) {
        console.log('Recipe not found in the database, fetching details from OpenAI for title:', normalisedTitle, 'and cooking time:', cookingTime);



        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant that provides recipe details." },
            { role: "user", content: `Provide detailed information for the recipe with title "${normalisedTitle}" and cooking time "${cookingTime}". Include the title, ingredients, and instructions. Return the response as a valid JSON object with the keys: id, title, ingredients, instructions, and cookingTime.` }
          ],
        });

        console.log('Completion response for recipe details:', completion.choices[0].message?.content);

        let recipeDetails: Recipe;

        try {
          const responseContent = completion.choices[0].message?.content || '{}';
          if (!isValidJSON(responseContent)) {
            throw new Error('Invalid JSON format from OpenAI');
          }
          recipeDetails = JSON.parse(responseContent);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid JSON format from OpenAI');
        }

        if (!recipeDetails.title || !recipeDetails.cookingTime || !recipeDetails.ingredients.length || !recipeDetails.instructions.length) {
          throw new Error('Incomplete recipe details: ' + JSON.stringify(recipeDetails));
        }

        let recipeImageUrl = imageUrl;
        let recipeImageUrlLarge = '';

        if (!imageUrl) {
          try {
            const response = await axios.get(`https://api.pexels.com/v1/search`, {
              params: {
                query: recipeDetails.title,
                per_page: 1,
              },
              headers: {
                Authorization: PEXELS_API_KEY,
              },
            });

            recipeImageUrl = response.data.photos[0]?.src?.small || '';
            recipeImageUrlLarge = response.data.photos[0]?.src?.large || '';
          } catch (error) {
            console.error(`Error fetching image for ${recipeDetails.title}:`, error);
            recipeImageUrl = '';
          }
        }

        // Create a stable ID for the recipe
        const stableId = `${normalisedTitle.toLowerCase().replace(/\s+/g, '-')}-${uuidv4().slice(0, 8)}`;

        // Save the recipe to the database
        recipe = await prisma.recipe.create({
          data: {
            id: stableId,
            title: recipeDetails.title,
            ingredients: recipeDetails.ingredients,
            instructions: recipeDetails.instructions,
            cookingTime: parseInt(cookingTime),
            imageUrl: recipeImageUrl,
            imageUrlLarge: recipeImageUrlLarge,
            author: { connect: { id: user.id } },
            comments: {
              create: [], // Initialize with an empty array 
            },
          },
          include: {
            author: true,
            comments: {
              include: {
                user: true,
                likes: true,
              },
            },
          },
        });

        // Create an activity for the new recipe
        await prisma.activity.create({
          data: {
            action: 'generated',
            user: { connect: { id: user.id } },
            recipe: { connect: { id: recipe.id } },
          },
        });
      }

     // Process comments and likes
     const commentsWithLikes = recipe.comments.map((comment: any) => ({
      ...comment,
      likes: comment.likes.length,
      isLiked: comment.likes.some((like: { userId: string }) => like.userId === session.user!.sub),
    }));

    return NextResponse.json({
      recipe: {
        ...recipe,
        comments: commentsWithLikes,
      },
    });
  } catch (error) {
    attempts++;
    console.error(`Attempt ${attempts} failed:`, error);
    if (attempts >= MAX_RETRIES) {
      return NextResponse.json({ error: 'Error fetching recipe details after multiple attempts' }, { status: 500 });
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
}
}