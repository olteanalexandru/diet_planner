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
const RETRY_DELAY = 1000;

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

    .replace(/-/g, ' ')   //replace - with " "
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
}

// First, define valid activity types
type ActivityType = 'generated' | 'created' | 'liked' | 'commented' | 'shared';

async function createRecipeActivity(userId: string, recipeId: string, activityType: ActivityType) {
  try {
    await prisma.activity.create({
      data: {
        type: activityType, // Changed from 'action' to 'type'
        user: {
          connect: { id: userId }
        },
        recipe: {
          connect: { id: recipeId }
        }
      }
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    // Don't throw - we don't want to fail the whole request if activity creation fails
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.sub;

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { title, cookingTime, imageUrl , recipeId  } = requestBody;

  if (recipeId) {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
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
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const commentsWithLikes = recipe.comments.map((comment: any) => ({
      ...comment,
      likes: comment.likes.length,
      isLiked: userId ? comment.likes.some((like: { userId: string }) => like.userId === userId) : false,
    }));

    return NextResponse.json({
      recipe: {
        ...recipe,
        comments: commentsWithLikes,
        isOwner: userId === recipe.author.id,
      },
    });

  }


  const normalisedTitle = normalizeTitle(title);

  console.log("normalisedTitle: ", normalisedTitle);

  let attempts = 0;
  while (attempts < MAX_RETRIES ) {
    try {
      // First, check if the recipe exists in the database
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

      // If recipe exists, return it with appropriate user-specific data
      if (recipe) {
        const commentsWithLikes = recipe.comments.map((comment: any) => ({
          ...comment,
          likes: comment.likes.length,
          isLiked: userId ? comment.likes.some((like: { userId: string }) => like.userId === userId) : false,
        }));

        return NextResponse.json({
          recipe: {
            ...recipe,
            comments: commentsWithLikes,
            isOwner: userId === recipe.author.id,
          },
        });
      }

      // If recipe doesn't exist and there's no user session, return AI-generated recipe without saving
      if (!userId) {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant that provides recipe details." },
            { role: "user", content: `Provide detailed information for the recipe with title "${normalisedTitle}" and cooking time "${cookingTime}". Include the title, ingredients, and instructions. Return the response as a valid JSON object with the keys: id, title, ingredients, instructions, and cookingTime.` }
          ],
        });

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

        // Get image if needed
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
          }
        }

        // Return generated recipe without saving to database
        return NextResponse.json({
          recipe: {
            ...recipeDetails,
            id: `temp-${uuidv4()}`,
            imageUrl: recipeImageUrl,
            imageUrlLarge: recipeImageUrlLarge,
            comments: [],
            isOwner: false,
          },
        });
      }

      // If user is authenticated and recipe doesn't exist, create and save it
      let user = await prisma.user.findUnique({
        where: { id: userId },
      });

      console.log("user session data", user , userId , session?.user?.email, session?.user?.name);

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: session?.user?.email || session?.user?.name,
            name: session?.user?.name || '',
          },
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that provides recipe details." },
          { role: "user", content: `Provide detailed information for the recipe with title "${normalisedTitle}" and cooking time "${cookingTime}". Include the title, ingredients, and instructions. Return the response as a valid JSON object with the keys: id, title, ingredients, instructions, and cookingTime.` }
        ],
      });

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
        }
      }

      const stableId = `${normalisedTitle.toLowerCase().replace(/\s+/g, '-')}-${uuidv4().slice(0, 8)}`;
      
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

      // Create activity with correct type field
      await createRecipeActivity(user.id, recipe.id, 'generated');

      return NextResponse.json({
        recipe: {
          ...recipe,
          comments: [],
          isOwner: true,
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

  return NextResponse.json({ error: 'Maximum retries exceeded' }, { status: 500 });
}