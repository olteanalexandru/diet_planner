# .eslintrc.json

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}

```

# .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env


# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts


```

# app\api\auth\[auth0]\route.ts

```ts
// app/api/auth/[auth0]/route.ts

import { handleAuth, handleCallback, getSession } from "@auth0/nextjs-auth0";
import type { NextApiRequest, NextApiResponse } from 'next';

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const GET = handleAuth({
  callback: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getSession(req, res);

      if (session?.user) {
        await prisma.user.upsert({
          where: { id: session.user.sub },
          update: {
            name: session.user.name || '',
            email: session.user.email || '',
          },
          create: {
            id: session.user.sub,
            name: session.user.name || '',
            email: session.user.email || '',
          },
        });
      }

      // It's crucial to ensure that `handleCallback` is properly awaited
      return await handleCallback(req, res);

    } catch (error) {
      console.error('Error in Auth0 callback:', error);

      // Redirect to login on error
      return Response.redirect(
        new URL('/api/auth/login', new URL(process.env.AUTH0_BASE_URL || 'http://localhost:3000'))
      );
    }
  }
});

```

# app\api\ClearDatabase\route.ts

```ts
//clear all database
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.commentLike.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.user.deleteMany();

    return NextResponse.json({ message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export default POST;




```

# app\api\comments\[commentId]\like\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { commentId: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = params;

    const like = await prisma.commentLike.create({
      data: {
        user: { connect: { id: session.user.sub } },
        comment: { connect: { id: commentId } },
      },
    });

    return NextResponse.json({ like });
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { commentId: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = params;

    await prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId: session.user.sub,
          commentId: commentId,
        },
      },
    });

    return NextResponse.json({ message: 'Comment unliked successfully' });
  } catch (error) {
    console.error('Error unliking comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

# app\api\comments\[commentId]\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { commentId: string } }) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { commentId } = params;
  const { content } = await req.json();

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { 
        content,
        updatedAt: new Date(),
      },
      include: { 
        user: true,
        likes: true,
      },
    });

    return NextResponse.json({
      comment: {
        ...updatedComment,
        likes: updatedComment.likes.length,
        isLiked: updatedComment.likes.some((like: { userId: string }) => like.userId === session.user.sub),
        isEdited: updatedComment.createdAt.getTime() !== updatedComment?.updatedAt?.getTime(),
      }
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Error updating comment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { commentId: string } }) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { commentId } = params;

  try {
    const comment = await prisma.comment.findUnique({ 
      where: { id: commentId },
      include: { user: true }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete associated likes first
    await prisma.commentLike.deleteMany({
      where: { commentId: commentId }
    });

    // Then delete the comment
    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Error deleting comment' }, { status: 500 });
  }
}
```

# app\api\comments\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get('recipeId');

  if (!recipeId) {
    return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { recipeId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId, content } = await req.json();

    const comment = await prisma.comment.create({
      data: {
        content,
        recipe: { connect: { id: recipeId } },
        user: { connect: { id: session.user.sub } },
      },
      include: { user: { select: { id: true, name: true } } },
    });

    // Create an activity for the new comment
    await prisma.activity.create({
      data: {
        action: 'commented',
        user: { connect: { id: session.user.sub } },
        recipe: { connect: { id: recipeId } },
      },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Error creating comment' }, { status: 500 });
  }
}
```

# app\api\favoriteHandler\route.ts

```ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, ingredients, instructions, cookingTime, imageUrl } = req.body;

  try {
    const recipe = await prisma.recipe.create({
      data: {
        title,
        ingredients,
        instructions,
        cookingTime,
        imageUrl,
        author: { connect: { email: session.user.email } },
      },
    });

    res.status(201).json({ recipe });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Error creating recipe' });
  }
}
```

# app\api\favorites\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.sub },
      include: { recipe: true },
    });

    return NextResponse.json({ favorites: favorites.map(f => f.recipe) });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Error fetching favorites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId } = await req.json();
    const favorite = await prisma.favorite.create({
      data: {
        user: { connect: { id: session.user.sub } },
        recipe: { connect: { id: recipeId } },
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Error adding favorite' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId } = await req.json();
    await prisma.favorite.delete({
      where: {
        userId_recipeId: {
          userId: session.user.sub,
          recipeId: recipeId,
        },
      },
    });

    return NextResponse.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Error removing favorite' }, { status: 500 });
  }
}
```

# app\api\followCounts\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const followersCount = await prisma.follow.count({
      where: { followingId: session.user.sub },
    });

    const followingCount = await prisma.follow.count({
      where: { followerId: session.user.sub },
    });

    return NextResponse.json({ followersCount, followingCount });
  } catch (error) {
    console.error('Error fetching follow counts:', error);
    return NextResponse.json({ error: 'Error fetching follow counts' }, { status: 500 });
  }
}
```

# app\api\followUsers\route.ts

```ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { followingId } = await req.json();

    const follow = await prisma.follow.create({
      data: {
        follower: { connect: { id: session.user.sub } },
        following: { connect: { id: followingId } },
      },
    });

    return NextResponse.json({ follow }, { status: 201 });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Error following user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { followingId } = await req.json();

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.sub,
          followingId: followingId,
        },
      },
    });

    return NextResponse.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Error unfollowing user' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const followingId = searchParams.get('followingId');

  if (!followingId) {
    return NextResponse.json({ error: 'Missing followingId parameter' }, { status: 400 });
  }

  try {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.sub,
          followingId: followingId,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Error checking follow status' }, { status: 500 });
  }
}
```

# app\api\getRecipeDetails\route.ts

```ts
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
```

# app\api\getRecipes\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';
import { Recipe } from './../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const keepNumbersOnly = (time: string): number => {
  return parseInt(time.replace(/\D/g, ''), 10);
};

const generateUniqueId = (recipe: Recipe, imageUrl: string): string => {
  return `${recipe.id}-${recipe.title.replace(/\s+/g, '-')}-${imageUrl}`;
};

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    const normalisedQuery = query.replace(/[^a-zA-Z0-9\s]/g, '');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an API that only returns raw JSON data. You never respond with additional text, explanations, or descriptions." },
        { role: "user", content: `Suggest 5 recipes for: ${normalisedQuery}. Only return a JSON array of objects, each with 'id', 'title', and 'cookingTime' properties. 'cookingTime' should be in exact minutes. Do not include any other text or explanations, only the JSON.` }
      ],
    });

    console.log('Completion response:', completion.choices[0].message?.content);

    let recipes: Recipe[] = [];

    try {
      recipes = JSON.parse(completion.choices[0].message?.content || '[]');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON format from OpenAI');
    }

    // Ensure the response is a valid array of recipes
    if (!Array.isArray(recipes) || recipes.some(recipe => typeof recipe.id !== 'number' || typeof recipe.title !== 'string' || typeof recipe.cookingTime !== 'number' || !recipe.title.trim())) {
      throw new Error('Invalid recipe format: ' + JSON.stringify(recipes));
    }

    // Fetch images for each recipe
    const recipesWithImages = await Promise.all(recipes.map(async (recipe) => {
      try {
        const response = await axios.get(`https://api.pexels.com/v1/search`, {
          params: {
            query: recipe.title,
            per_page: 1,
          },
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        });

        const imageUrl = response.data.photos[0]?.src?.small || '';
        const imageUrlLarge = response.data.photos[0]?.src?.large || '';

        return { 
          ...recipe,
          id: generateUniqueId(recipe, imageUrl),
          cookingTime: recipe.cookingTime ? keepNumbersOnly(recipe.cookingTime.toString()) : 0, 
          imageUrl ,
          imageUrlLarge

        };
      } catch (error) {
        console.error(`Error fetching image for ${recipe.title}:`, error);
        return { 
          ...recipe,
          id: generateUniqueId(recipe, ''),
          cookingTime: recipe.cookingTime !== undefined ? keepNumbersOnly(recipe.cookingTime.toString()) : 0, 
          imageUrl: '',
          imageUrlLarge: ''
        };
      }
    }));

    return NextResponse.json({ recipes: recipesWithImages });
  } catch (error) {
    console.error('Error in getRecipes:', error);
    return NextResponse.json({ error: 'Error fetching recipes' }, { status: 500 });
  }
}




```

# app\api\mealPlanning\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mealPlan = await prisma.mealPlan.findMany({
      where: { userId: session.user.sub },
      include: { recipe: true },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return NextResponse.json({ error: 'Error fetching meal plan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date, recipeId } = await req.json();

    const mealPlan = await prisma.mealPlan.create({
      data: {
        date: new Date(date),
        recipeId,
        userId: session.user.sub,
      },
    });

    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error('Error adding to meal plan:', error);
    return NextResponse.json({ error: 'Error adding to meal plan' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mealPlan } = await req.json();

    // Update meal plan (this is a simplified version, you might want to add more validation)
    for (const meal of mealPlan) {
      await prisma.mealPlan.update({
        where: { id: meal.id },
        data: { date: new Date(meal.date) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating meal plan:', error);
    return NextResponse.json({ error: 'Error updating meal plan' }, { status: 500 });
  }
}
```

# app\api\premium\route.ts

```ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-09-30.acacia' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/canceled`,
      customer_email: session.user.email,
    });

    res.status(200).json({ sessionId: stripeSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
}
```

# app\api\recipes\[recipeId]\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { recipeId: string } }) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { recipeId } = params;
  const { title, ingredients, instructions, cookingTime } = await req.json();

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { author: true },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.authorId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        title,
        ingredients,
        instructions,
        cookingTime: parseInt(cookingTime),
      },
      include: { author: true },
    });

    return NextResponse.json({ recipe: updatedRecipe });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json({ error: 'Error updating recipe' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { recipeId: string } }) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { recipeId } = params;

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { author: true },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.authorId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete related records first
    await prisma.favorite.deleteMany({ where: { recipeId } });
    await prisma.mealPlan.deleteMany({ where: { recipeId } });
    await prisma.activity.deleteMany({ where: { recipeId } });
    await prisma.comment.deleteMany({ where: { recipeId } });

    // Then delete the recipe
    await prisma.recipe.delete({ where: { id: recipeId } });

    return NextResponse.json({ message: 'Recipe deleted successfully' + recipeId });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Error deleting recipe' }, { status: 500 });
  }
}
```

# app\api\recipes\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

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
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, ingredients, instructions, cookingTime, imageUrl } = await req.json();

    if (!title || !ingredients || !instructions || !cookingTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        ingredients,
        instructions,
        cookingTime: parseInt(cookingTime),
        imageUrl,
        author: { connect: { id: session.user.sub } },
      },
    });

    await prisma.activity.create({
      data: {
        action: 'created',
        user: { connect: { id: session.user.sub } },
        recipe: { connect: { id: recipe.id } },
      },
    });

    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

# app\api\socialFeed\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.sub },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    const activities = await prisma.activity.findMany({
      where: { userId: { in: followingIds } },
      include: { user: true, recipe: true },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent activities
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      userName: activity.user.name,
      action: activity.action,
      recipeId: activity.recipeId,
      recipeTitle: activity.recipe.title,
      timestamp: activity.createdAt.toISOString(),
    }));

    return NextResponse.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Error fetching social feed:', error);
    return NextResponse.json({ error: 'Error fetching social feed' }, { status: 500 });
  }
}
```

# app\api\suggestOtherRecipes\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';
import { Recipe } from './../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const keepNumbersOnly = (time: string): number => {
  return parseInt(time.replace(/\D/g, ''), 10);
};

const generateUniqueId = (recipe: Recipe, imageUrl: string): string => {
  return `${recipe.id}-${recipe.title.replace(/\s+/g, '-')}-${imageUrl}`;
};

export async function POST(req: NextRequest) {
  try {
    const { query, avoid } = await req.json();

    const normalisedQuery = query.replace(/[^a-zA-Z0-9\s]/g, '');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an API that only returns raw JSON data. You never respond with additional text, explanations, or descriptions." },
        { role: "user", content: `Suggest 5 recipes for: ${normalisedQuery}. Do not include the recipes ${avoid}. Only return a JSON array of objects, each with 'id', 'title', and 'cookingTime' properties. 'cookingTime' should be in exact minutes. Do not include any other text or explanations, only the JSON.` }
      ],
    });

    console.log('Completion response:', completion.choices[0].message?.content);

    let recipes: Recipe[] = [];

    try {
      recipes = JSON.parse(completion.choices[0].message?.content || '[]');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON format from OpenAI');
    }

    // Ensure the response is a valid array of recipes
    if (!Array.isArray(recipes) || recipes.some(recipe => typeof recipe.id !== 'number' || typeof recipe.title !== 'string' || typeof recipe.cookingTime !== 'number' || !recipe.title.trim())) {
      throw new Error('Invalid recipe format: ' + JSON.stringify(recipes));
    }

    // Fetch images for each recipe
    const recipesWithImages = await Promise.all(recipes.map(async (recipe) => {
      try {
        const response = await axios.get(`https://api.pexels.com/v1/search`, {
          params: {
            query: recipe.title,
            per_page: 1,
          },
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        });

        const imageUrl = response.data.photos[0]?.src?.small || '';

        return { 
          ...recipe,
          id: generateUniqueId(recipe, imageUrl),
          cookingTime: recipe.cookingTime ? keepNumbersOnly(recipe.cookingTime.toString()) : 0, 
          imageUrl 
        };
      } catch (error) {
        console.error(`Error fetching image for ${recipe.title}:`, error);
        return { 
          ...recipe,
          id: generateUniqueId(recipe, ''),
          cookingTime: recipe.cookingTime !== undefined ? keepNumbersOnly(recipe.cookingTime.toString()) : 0, 
          imageUrl: '' 
        };
      }
    }));

    return NextResponse.json({ recipes: recipesWithImages });
  } catch (error) {
    console.error('Error in getRecipes:', error);
    return NextResponse.json({ error: 'Error fetching recipes' }, { status: 500 });
  }
}
```

# app\api\users\[userId]\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Error fetching user profile' }, { status: 500 });
  }
}
```

# app\Components\Comment.tsx

```tsx
import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
    };
    likes: number;
    isLiked: boolean;
    createdAt: string;
    updatedAt: string;
  };
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
  onLike: (commentId: string) => void;
  onUnlike: (commentId: string) => void;
}

export const Comment: React.FC<CommentProps> = ({ comment, onDelete, onEdit, onLike, onUnlike }) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEdit(comment.id, editedContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  const handleLikeToggle = () => {
    if (comment.isLiked) {
      onUnlike(comment.id);
    } else {
      onLike(comment.id);
    }
  };

  const isEdited = new Date(comment.updatedAt).getTime() !== new Date(comment.createdAt).getTime();

  return (
    <div className="comment">
      {isEditing ? (
        <>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <button onClick={handleSaveEdit}>Save</button>
          <button onClick={handleCancelEdit}>Cancel</button>
        </>
      ) : (
        <>
          <p>{comment.content}</p>
          <p>By: {comment.user.name}</p>
          <button onClick={handleLikeToggle}>
            {comment.isLiked ? 'Unlike' : 'Like'} ({comment.likes})
          </button>
          {user && user.sub === comment.user.id && (
            <>
              <button onClick={handleEdit}>Edit</button>
              <button onClick={() => onDelete(comment.id)}>Delete</button>
            </>
          )}
          {isEdited && <small className="text-muted">Edited</small>}
        </>
      )}
    </div>
  );
};
```

# app\Components\Favorites.tsx

```tsx
import React, { useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { usePathname } from 'next/navigation';
import {  Recipe, FavouriteRecipeComponentProps } from '../types';

export default function Favorites() {
  const { favorites, removeFavorite } = useFavorites();
  const pathname = usePathname();

  if (pathname !== '/') {
    return null;
  }

  if (favorites.length < 1) {
    return null;
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4 h2" style={{ fontWeight: 'bold' }}>Favorites</h2>
      <div className="row">
        {favorites.map((fav) => (
          <div key={fav.id} className="d-flex align-items-center bg-light rounded mb-3" style={{ boxShadow: '0 6px 10px rgba(0, 0, 0, 0.1)', paddingLeft: 0 }}>
            <div style={{ flexShrink: 0 }}>
              <img
                src={fav.imageUrl}
                alt={fav.title}
                className="me-3"
                style={{ height: 'auto', borderRadius: '8px' , maxWidth: '80px', maxHeight: '100px' }}
              />
            </div>
            <div className="flex-grow-1">
              <h2 className="h5 mb-1">
                <Link href={`/recipe/${fav.title}/${fav.cookingTime}`} className="text-decoration-none" style={{ color: 'black' }}>
                  {fav.title}
                </Link>
              </h2>
              <p className="mb-0">{fav.cookingTime} min.</p>
            </div>
            <button
              className="btn btn-link text-muted"
              onClick={() => removeFavorite(fav)}
            >
              <Heart size={24} color="#65558F" fill="#65558F" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}




export const FavouriteRecipeComponent: React.FC<FavouriteRecipeComponentProps> = ({ recipe, favorites, setFavorites }) => {

  const toggleFavorite = (recipe: Recipe): void => {
    const exists = favorites.some((fav) => fav.title === recipe.title && fav.cookingTime === recipe.cookingTime);
    
    if (exists) {
      setFavorites(favorites.filter((fav) => fav.title !== recipe.title || fav.cookingTime !== recipe.cookingTime));
    } else {
      const newFavorite: Recipe = { ...recipe };
      setFavorites([...favorites, newFavorite]);
    }
  };

  useEffect(() => {
    console.log("New Favorites: ", favorites);
  }, [favorites]);

  const isFavorite = favorites.some((fav) => fav.title == recipe.title && fav.cookingTime == recipe.cookingTime);

  return (
    <Heart
      size={24}
      color='#65558F'
      onClick={() => toggleFavorite(recipe)}
      fill={isFavorite ? '#65558F' : 'none'}
    />
  );
};

```

# app\Components\FollowButton.tsx

```tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface FollowButtonProps {
  userId: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ userId }) => {
  const { user } = useUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFollowStatus();
    }
  }, [user, userId]);

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/followUsers?followingId=${userId}`);
      const data = await response.json();
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/followUsers', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      } else {
        console.error('Failed to update follow status');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.sub === userId) return null;

  return (
    <button
      className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
      onClick={handleFollowToggle}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
    </button>
  );
};
```

# app\Components\Header.tsx

```tsx
import React from 'react';
import Link from 'next/link';
import { LoginButton } from './LoginButton';

export const Header: React.FC = () => {
  return (
    <header className="navbar navbar-expand-lg navbar-dark bg-primary py-3" style={{
      background: 'linear-gradient(135deg, rgba(13,110,253,0.8), rgba(13,110,253,0.6))',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }}>
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <span className="me-2" style={{ fontSize: '1.5rem' }}>🍽️</span>
          <span style={{
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
          }}>
            FutureRecipes
          </span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center">
            <li className="nav-item">
              <Link href="/dashboard" className="nav-link px-3 py-2 rounded-pill transition-all hover-shadow">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link href="/create-recipe" className="nav-link px-3 py-2 rounded-pill transition-all hover-shadow">Create Recipe</Link>
            </li>
            <li className="nav-item">
              <Link href="/social-feed" className="nav-link px-3 py-2 rounded-pill transition-all hover-shadow">Social Feed</Link>
            </li>
            <li className="nav-item ms-lg-3">
              <LoginButton />
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};
```

# app\Components\LoginButton.tsx

```tsx
'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export const LoginButton: React.FC = () => {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (user) {
    return (
      <div className="d-flex align-items-center">
        <span className="me-2">Welcome, {user.name}!</span>
        <Link href="/api/auth/logout" className="btn btn-outline-light">
          Log Out
        </Link>
      </div>
    );
  }

  return (
    <Link href="/api/auth/login" className="btn btn-outline-light">
      Log In
    </Link>
  );
};
```

# app\Components\MealPlanner.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types';

interface MealPlan {
  id: string;
  date: string;
  recipe: Recipe;
}

export const MealPlanner: React.FC = () => {
  const { user } = useUser();
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (user) {
      fetchMealPlan();
      fetchUserRecipes();
    }
  }, [user]);

  const fetchMealPlan = async () => {
    const response = await fetch('/api/mealPlanning');
    const data = await response.json();
    setMealPlan(data.mealPlan);
  };

  const fetchUserRecipes = async () => {
    const response = await fetch('/api/recipes');
    const data = await response.json();
    setRecipes(data.recipes);
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const newMealPlan = Array.from(mealPlan);
    const [reorderedItem] = newMealPlan.splice(result.source.index, 1);
    newMealPlan.splice(result.destination.index, 0, reorderedItem);

    setMealPlan(newMealPlan);

    // Update the meal plan on the server
    await fetch('/api/mealPlanning', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealPlan: newMealPlan }),
    });
  };

  return (
    <div className="container mt-5">
      <h2>Meal Planner</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="mealPlan">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {mealPlan.map((meal, index) => (
                <Draggable key={meal.id} draggableId={meal.id} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="mb-3 p-3 bg-light rounded"
                    >
                      <strong>{meal.date}</strong>: {meal.recipe.title}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <h3 className="mt-4">Available Recipes</h3>
      <ul>
        {recipes.map((recipe) => (
          <li key={recipe.id}>{recipe.title}</li>
        ))}
      </ul>
    </div>
  );
};

```

# app\Components\PremiumFeatures.tsx

```tsx
// app/Components/PremiumFeatures.tsx

import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export const PremiumFeatures: React.FC = () => {
  const { user, error, isLoading } = useUser();
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/premium', { method: 'POST' });
      const { sessionId } = await response.json();
      // Redirect to Stripe Checkout
      window.location.href = `/api/checkout_sessions/${sessionId}`;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      setUpgradeError('An error occurred while upgrading. Please try again.');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mt-5">
      <h2>Premium Features</h2>
      {user?.subscriptionStatus === 'premium' ? (
        <div>
          <p>Thank you for being a premium member! Enjoy these exclusive features:</p>
          <ul>
            <li>Advanced meal planning</li>
            <li>Nutritional information for all recipes</li>
            <li>Ad-free experience</li>
            <li>Priority customer support</li>
          </ul>
        </div>
      ) : (
        <div>
          <p>Upgrade to Premium to unlock exclusive features:</p>
          <ul>
            <li>Advanced meal planning</li>
            <li>Nutritional information for all recipes</li>
            <li>Ad-free experience</li>
            <li>Priority customer support</li>
          </ul>
          <button className="btn btn-primary mt-3" onClick={handleUpgrade}>
            Upgrade to Premium
          </button>
          {upgradeError && <p className="text-danger mt-2">{upgradeError}</p>}
        </div>
      )}
    </div>
  );
};
```

# app\Components\Recipe.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Comment } from './Comment';
import { Recipe as RecipeType, Comment as CommentType } from '../types';

interface RecipeProps {
  recipe: RecipeType;
  onDelete: (recipeId: string) => void;
  onEdit: (recipeId: string, updatedRecipe: RecipeType) => void;
}

export const Recipe: React.FC<RecipeProps> = ({ recipe, onDelete, onEdit }) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);
  const [comments, setComments] = useState<CommentType[]>(recipe.comments || []);

  useEffect(() => {
    setComments(recipe.comments || []);
  }, [recipe]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedRecipe),
      });
      if (response.ok) {
        const updatedRecipe = await response.json();
        onEdit(recipe.id, updatedRecipe);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedRecipe(recipe);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        onDelete(recipe.id);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      } else {
        const errorData = await response.json();
        console.error('Error deleting comment:', errorData.error);
        
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      

    }
  };

  const handleCommentEdit = async (commentId: string, newContent: string) => {
    console.log('Editing comment:', commentId, newContent);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
      if (response.ok) {
        const { comment: updatedComment } = await response.json();
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId ? updatedComment : comment
          )
        );
      } else {
        const errorData = await response.json();
        console.error('Error editing comment:', errorData.error);
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { ...comment, likes: comment.likes + 1, isLiked: true }
            : comment
        ));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleCommentUnlike = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { ...comment, likes: comment.likes - 1, isLiked: false }
            : comment
        ));
      }
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  };

  return (
    <div className="recipe">
      {isEditing ? (
        <>
          <input
            value={editedRecipe.title}
            onChange={(e) => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
          />
          {/* Add more fields for editing ingredients, instructions, etc. */}
          <button onClick={handleSaveEdit}>Save</button>
          <button onClick={handleCancelEdit}>Cancel</button>
        </>
      ) : (
        <>
          <h2>{recipe.title}</h2>
          {/* Display other recipe details */}
          {user && user.sub === recipe.authorId && (
            <>
              <button onClick={handleEdit}>Edit</button>
              <button onClick={handleDelete}>Delete</button>
            </>
          )}
          {/* Display comments */}
          {comments.map((comment: CommentType) => (
            <Comment
              key={comment.id}
              comment={comment}
              onDelete={handleCommentDelete}
              onEdit={handleCommentEdit}
              onLike={handleCommentLike}
              onUnlike={handleCommentUnlike}
            />
          ))}
        </>
      )}
    </div>
  );
};
```

# app\Components\RecipeCard.tsx

```tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Recipe } from '../types';
import { useFavorites } from '../context/FavoritesContext';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFavorite = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isFavorite(recipe)) {
        await removeFavorite(recipe);
      } else {
        await addFavorite(recipe);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError('Failed to update favorite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center bg-light p-3 rounded mb-3" style={{ boxShadow: '0 6px 10px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ flexShrink: 0, height: '100%' }}>
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="me-3"
          style={{ height: 'auto', borderRadius: '8px', maxWidth: '80px', maxHeight: '100px' }}
        />
      </div>
      <div className="flex-grow-1">
        <h2 className="h5 mb-1">
          <Link href={`/recipe/${recipe.title}/${recipe.cookingTime}`} className="text-decoration-none" style={{ color: 'black' }}>
            {recipe.title}
          </Link>
        </h2>
        <p className="mb-0">{recipe.cookingTime} min.</p>
      </div>
      <button
        className="btn btn-link"
        onClick={toggleFavorite}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ) : (
          <Heart size={24} color="#65558F" fill={isFavorite(recipe) ? '#65558F' : 'none'} />
        )}
      </button>
      {error && <div className="text-danger">{error}</div>}
    </div>
  );
};
```

# app\Components\RecipeForm.tsx

```tsx
'use client';
import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';


export const RecipeForm: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [cookingTime, setCookingTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);



  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to submit a recipe');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          ingredients: ingredients.filter(i => i.trim() !== ''),
          instructions: instructions.filter(i => i.trim() !== ''),
          cookingTime,
          imageUrl
        }),
      });
      
      if (response.ok) {
        setSuccess(true);
        router.push('/dashboard');
      } else {

        const data = await response.json();
        setError(data.error || 'An error occurred while submitting the recipe');
      }
    } catch (error) {
      console.error('Error submitting recipe:', error);
      setError('An error occurred while submitting the recipe');
    } finally {
      setIsSubmitting(false);
      
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <h2>Submit a New Recipe</h2>
      {error && <p className="text-danger">{error}</p>}
      {success && <p className="text-success">Recipe submitted successfully!</p>}
      <div className="mb-3">
        <label htmlFor="title" className="form-label">Title</label>
        <input
          type="text"
          className="form-control"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Ingredients</label>
        {ingredients.map((ingredient, index) => (
          <input
            key={index}
            type="text"
            className="form-control mb-2"
            value={ingredient}
            onChange={(e) => handleIngredientChange(index, e.target.value)}
            required
          />
        ))}
        <button type="button" className="btn btn-secondary" onClick={handleAddIngredient}>
          Add Ingredient
        </button>
      </div>
      <div className="mb-3">
        <label className="form-label">Instructions</label>
        {instructions.map((instruction, index) => (
          <textarea
            key={index}
            className="form-control mb-2"
            value={instruction}
            onChange={(e) => handleInstructionChange(index, e.target.value)}
            required
          />
        ))}
        <button type="button" className="btn btn-secondary" onClick={handleAddInstruction}>
          Add Instruction
        </button>
      </div>
      <div className="mb-3">
        <label htmlFor="cookingTime" className="form-label">Cooking Time (minutes)</label>
        <input
          type="number"
          className="form-control"
          id="cookingTime"
          value={cookingTime}
          onChange={(e) => setCookingTime(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="imageUrl" className="form-label">Image URL</label>
        <input
          type="url"
          className="form-control"
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">Submit Recipe</button>
    </form>
  );
};
```

# app\Components\SocialFeed.tsx

```tsx
import React, { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  recipeId: string;
  recipeTitle: string;
  timestamp: string;
}

export const SocialFeed: React.FC = () => {
  const { user } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/socialFeed');
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      const data = await response.json();
      setActivities(data.activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Failed to load social feed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading social feed...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h2>Social Feed</h2>
      {activities.length === 0 ? (
        <p>No recent activities from your network.</p>
      ) : (
        <ul className="list-group">
          {activities.map((activity) => (
            <li key={activity.id} className="list-group-item">
              <strong>{activity.userName}</strong> {activity.action}{' '}
              <Link href={`/recipe/${activity.recipeId}`}>
                {activity.recipeTitle}
              </Link>
              <br />
              <small className="text-muted">{new Date(activity.timestamp).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

# app\context\CommentContext.tsx

```tsx
'use client';
import React, { createContext, useContext, useState } from 'react';
import { Comment } from '../types';

interface CommentContextType {
  comments: Comment[];
  addComment: (recipeId: string, content: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const CommentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comments, setComments] = useState<Comment[]>([]);

  const addComment = async (recipeId: string, content: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, content }),
      });
      const data = await response.json();
      setComments(prevComments => [...prevComments, data.comment]);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const editComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      setComments(prevComments => 
        prevComments.map(comment => comment.id === commentId ? data.comment : comment)
      );
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const likeComment = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
      setComments(prevComments => prevComments.map(comment => 
        comment.id === commentId ? { ...comment, likes: comment.likes + 1, isLiked: true } : comment
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const unlikeComment = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}/like`, { method: 'DELETE' });
      setComments(prevComments => prevComments.map(comment => 
        comment.id === commentId ? { ...comment, likes: comment.likes - 1, isLiked: false } : comment
      ));
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  };

  return (
    <CommentContext.Provider value={{ comments, addComment, editComment, deleteComment, likeComment, unlikeComment }}>
      {children}
    </CommentContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentProvider');
  }
  return context;
};
```

# app\context\FavoritesContext.tsx

```tsx
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe } from '../types';

interface FavoritesContextType {
  favorites: Recipe[];
  addFavorite: (recipe: Recipe) => Promise<void>;
  removeFavorite: (recipe: Recipe) => Promise<void>;
  isFavorite: (recipe: Recipe) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const addFavorite = async (recipe: Recipe) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id }),
      });
      if (response.ok) {
        setFavorites((prevFavorites) => [...prevFavorites, recipe]);
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const removeFavorite = async (recipe: Recipe) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id }),
      });
      if (response.ok) {
        setFavorites((prevFavorites) =>
          prevFavorites.filter((fav) => fav.id !== recipe.id)
        );
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const isFavorite = (recipe: Recipe) => {
    return favorites.some((fav) => fav.id === recipe.id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
```

# app\context\RecipeContext.tsx

```tsx
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe } from '../types';

interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  fetchRecipes: (query: string) => Promise<void>;
  fetchRecipeDetails: (title: string, cookingTime: string) => Promise<Recipe | null>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/getRecipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeDetails = async (title: string, cookingTime: string): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/getRecipeDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, cookingTime }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }
      const data = await response.json();
      return data.recipe;
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setError('Failed to load recipe details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecipeContext.Provider value={{ recipes, loading, error, fetchRecipes, fetchRecipeDetails }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};
```

# app\create-recipe\page.tsx

```tsx
'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { RecipeForm } from '../Components/RecipeForm';

export default function CreateRecipe() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to create a recipe.</div>;

  return (
    <div className="container mt-5">
      <h1>Create a New Recipe</h1>
      <RecipeForm />
    </div>
  );
}
```

# app\dashboard\page.tsx

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types';
import { RecipeCard } from '../Components/RecipeCard';
import Link from 'next/link';

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCustomRecipes();
      fetchFavorites();
      fetchFollowCounts();
    }
  }, [user]);

  const fetchCustomRecipes = async () => {
    try {
      const response = await fetch('/api/recipes');
      if (!response.ok) {
        throw new Error('Failed to fetch custom recipes');
      }
      const data = await response.json();
      setCustomRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching custom recipes:', error);
      setError('Failed to load custom recipes');
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await response.json();
      setFavorites(data.favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to load favorites');
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const response = await fetch('/api/followCounts');
      if (!response.ok) {
        throw new Error('Failed to fetch follow counts');
      }
      const data = await response.json();
      setFollowersCount(data.followersCount);
      setFollowingCount(data.followingCount);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
      setError('Failed to load social stats');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view your dashboard.</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1>Welcome, {user.name}!</h1>
      <div className="row mt-4">
        <div className="col-md-6">
          <h2>Your Custom Recipes</h2>
          {customRecipes.length > 0 ? (
            customRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          ) : (
            <p>You haven't created any custom recipes yet.</p>
          )}
          <Link href="/create-recipe" className="btn btn-primary mt-3">Create New Recipe</Link>
        </div>
        <div className="col-md-6">
          <h2>Your Favorites</h2>
          {favorites.length > 0 ? (
            favorites.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          ) : (
            <p>You haven't added any favorites yet.</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <h2>Social Stats</h2>
        <p>Followers: {followersCount}</p>
        <p>Following: {followingCount}</p>
      </div>
    </div>
  );
}
```

# app\favicon.ico

This is a binary file of the type: Binary

# app\fonts\GeistMonoVF.woff

This is a binary file of the type: Binary

# app\fonts\GeistVF.woff

This is a binary file of the type: Binary

# app\globals.css

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
}

```

# app\hooks\useLocalStorage.tsx

```tsx
'use client';
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
```

# app\layout.tsx

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FavoritesProvider } from './context/FavoritesContext';
import { RecipeProvider } from './context/RecipeContext';
import { CommentProvider } from './context/CommentContext';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Header } from './Components/Header';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "FutureRecipes",
  description: "A modern recipe management application for the future of cooking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-dark text-light`}>
        <UserProvider>
          <RecipeProvider>
            <CommentProvider>
              <FavoritesProvider>
                <Header />
                <main className="container py-4">
                  <div className="row justify-content-center">
                    <div className="col-lg-10">
                      <div className="bg-light bg-opacity-10 p-4 rounded-3 shadow-lg">
                        {children}
                      </div>
                    </div>
                  </div>
                </main>
              </FavoritesProvider>
            </CommentProvider>
          </RecipeProvider>
        </UserProvider>
      </body>
    </html>
  );
}

```

# app\page.module.css

```css
.page {
  --gray-rgb: 0, 0, 0;
  --gray-alpha-200: rgba(var(--gray-rgb), 0.08);
  --gray-alpha-100: rgba(var(--gray-rgb), 0.05);

  --button-primary-hover: #383838;
  --button-secondary-hover: #f2f2f2;

  display: grid;
  grid-template-rows: 20px 1fr 20px;
  align-items: center;
  justify-items: center;
  min-height: 100svh;
  padding: 80px;
  gap: 64px;
  font-family: var(--font-geist-sans);
}

@media (prefers-color-scheme: dark) {
  .page {
    --gray-rgb: 255, 255, 255;
    --gray-alpha-200: rgba(var(--gray-rgb), 0.145);
    --gray-alpha-100: rgba(var(--gray-rgb), 0.06);

    --button-primary-hover: #ccc;
    --button-secondary-hover: #1a1a1a;
  }
}

.main {
  display: flex;
  flex-direction: column;
  gap: 32px;
  grid-row-start: 2;
}

.main ol {
  font-family: var(--font-geist-mono);
  padding-left: 0;
  margin: 0;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: -0.01em;
  list-style-position: inside;
}

.main li:not(:last-of-type) {
  margin-bottom: 8px;
}

.main code {
  font-family: inherit;
  background: var(--gray-alpha-100);
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 600;
}

.ctas {
  display: flex;
  gap: 16px;
}

.ctas a {
  appearance: none;
  border-radius: 128px;
  height: 48px;
  padding: 0 20px;
  border: none;
  border: 1px solid transparent;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 20px;
  font-weight: 500;
}

a.primary {
  background: var(--foreground);
  color: var(--background);
  gap: 8px;
}

a.secondary {
  border-color: var(--gray-alpha-200);
  min-width: 180px;
}

.footer {
  grid-row-start: 3;
  display: flex;
  gap: 24px;
}

.footer a {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer img {
  flex-shrink: 0;
}

/* Enable hover only on non-touch devices */
@media (hover: hover) and (pointer: fine) {
  a.primary:hover {
    background: var(--button-primary-hover);
    border-color: transparent;
  }

  a.secondary:hover {
    background: var(--button-secondary-hover);
    border-color: transparent;
  }

  .footer a:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
}

@media (max-width: 600px) {
  .page {
    padding: 32px;
    padding-bottom: 80px;
  }

  .main {
    align-items: center;
  }

  .main ol {
    text-align: center;
  }

  .ctas {
    flex-direction: column;
  }

  .ctas a {
    font-size: 14px;
    height: 40px;
    padding: 0 16px;
  }

  a.secondary {
    min-width: auto;
  }

  .footer {
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
  }
}

@media (prefers-color-scheme: dark) {
  .logo {
    filter: invert();
  }
}

```

# app\page.tsx

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Favorites from './Components/Favorites';


export default function Home() {
  const [query, setQuery] = useState<string>('');
  const router = useRouter();
   
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/recipes/?query=${encodeURIComponent(query)}`);
  };
  
  return (
    <div className="container mt-5">

      <form onSubmit={handleSearch}>
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="What do you feel like eating?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ 
              background: 'none', 
              color: 'grey', 
              borderColor: 'lightGrey', 
              borderRight: 'none', 
              borderTopLeftRadius: '50px', 
              borderBottomLeftRadius: '50px'
            }}
          />
          <button 
            className="btn btn-primary" 
            type="submit" 
            style={{ 
              background: 'none', 
              color: 'grey', 
              borderColor: 'lightGrey', 
              borderLeft: 'none', 
              borderTopRightRadius: '50px', 
              borderBottomRightRadius: '50px'
            }}
          >
            Search
          </button>
        </div>
      </form>
      <Favorites />
    </div>
  );
}



```

# app\profile\[userId]\page.tsx

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../../types';
import { RecipeCard } from '../../Components/RecipeCard';
import { FollowButton } from '../../Components/FollowButton';

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserRecipes();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      setProfile(data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    }
  };

  const fetchUserRecipes = async () => {
    try {
      const response = await fetch(`/api/recipes?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user recipes');
      }
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      setError('Failed to load user recipes');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!profile) return <div>User not found</div>;

  return (
    <div className="container mt-5">
      <h1>{profile.name}'s Profile</h1>
      {currentUser && currentUser.sub !== profile.id && (
        <FollowButton userId={profile.id} />
      )}
      <h2 className="mt-4">Recipes by {profile.name}</h2>
      {recipes.length > 0 ? (
        recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))
      ) : (
        <p>{profile.name} hasn't created any recipes yet.</p>
      )}
    </div>
  );
}
```

# app\recipe\[title]\[cookingTime]\page.tsx

```tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe, Comment } from '../../../types';
import { RecipeSkeleton } from './RecipeSkeleton';
import { FollowButton } from '../../../Components/FollowButton';
import { Heart } from 'lucide-react';
import { useFavorites } from '../../../context/FavoritesContext';
import { useRecipes } from '../../../context/RecipeContext';
import { useComments } from '../../../context/CommentContext';

export default function RecipeDetails() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(null);
  const { title, cookingTime } = useParams() as { title: string; cookingTime: string };
  const [newComment, setNewComment] = useState('');
  const { user } = useUser();
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { loading, error, fetchRecipeDetails } = useRecipes();
  const { comments, addComment, editComment, deleteComment, likeComment, unlikeComment } = useComments();

  useEffect(() => {
    if (title && cookingTime) {
      fetchRecipeDetails(title, cookingTime).then(fetchedRecipe => {
        if (fetchedRecipe) {
          setRecipe(fetchedRecipe);
          setEditedRecipe(fetchedRecipe);
        }
      });
    }
  }, [title, cookingTime, fetchRecipeDetails]);

  const toggleFavorite = async () => {
    if (!recipe) return;
    try {
      if (isFavorite(recipe)) {
        await removeFavorite(recipe);
      } else {
        await addFavorite(recipe);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedRecipe(recipe);
  };

  const handleSaveEdit = async () => {
    if (!editedRecipe) return;
    try {
      const response = await fetch(`/api/recipes/${recipe?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedRecipe),
      });
      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  const handleRecipeDelete = async () => {
    if (!recipe) return;
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipe) return;
    await addComment(recipe.id, newComment);
    setNewComment('');
  };

  if (loading) return <RecipeSkeleton />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!recipe) return <div className="container mt-5">Recipe not found</div>;

  return (
    <div className="container mt-5">
      {isEditing ? (
        <div>
          <h1>Edit Recipe</h1>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                id="title"
                value={editedRecipe?.title || ''}
                onChange={(e) => setEditedRecipe(prev => prev ? {...prev, title: e.target.value} : null)}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="cookingTime" className="form-label">Cooking Time (minutes)</label>
              <input
                type="number"
                className="form-control"
                id="cookingTime"
                value={editedRecipe?.cookingTime || ''}
                onChange={(e) => setEditedRecipe(prev => prev ? {...prev, cookingTime: e.target.value} : null)}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="ingredients" className="form-label">Ingredients</label>
              <textarea
                className="form-control"
                id="ingredients"
                value={editedRecipe?.ingredients.join('\n') || ''}
                onChange={(e) => setEditedRecipe(prev => prev ? {...prev, ingredients: e.target.value.split('\n')} : null)}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="instructions" className="form-label">Instructions</label>
              <textarea
                className="form-control"
                id="instructions"
                value={editedRecipe?.instructions.join('\n') || ''}
                onChange={(e) => setEditedRecipe(prev => prev ? {...prev, instructions: e.target.value.split('\n')} : null)}
              />
            </div>
            <button type="submit" className="btn btn-primary me-2">Save Changes</button>
            <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
          </form>
        </div>
      ) : (
        <div>
          <div className="row">
            <div className="col-md-6">
              <img src={recipe.imageUrlLarge} alt={recipe.title} className="img-fluid mb-4" style={{ width: '20rem', height: 'auto' }} />
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="mb-0">{recipe.title}</h1>
                <button
                  className="btn btn-link"
                  onClick={toggleFavorite}
                >
                  <Heart size={24} color="#65558F" fill={isFavorite(recipe) ? '#65558F' : 'none'} />
                </button>
              </div>
              <p className="text-muted">{recipe.cookingTime} mins</p>
              {user && user.sub === recipe.authorId && (
                <div>
                  <button className="btn btn-primary me-2" onClick={handleEdit}>Edit</button>
                  <button className="btn btn-danger" onClick={handleRecipeDelete}>Delete</button>
                </div>
              )}
            </div>
            <div className="col-md-6">
              <h2 className="mt-4">Ingredients:</h2>
              <ul className="list-unstyled">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
              <h2 className="mt-4">Instructions:</h2>
              <ol>
                {recipe.instructions.map((step, index) => (
                  <li key={index} className="mb-2">{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-5">
            <h3>Comments</h3>
            {comments.map((comment: Comment) => (
              <div key={comment.id} className="mb-3">
                <strong>{comment.user.name}</strong>
                <p>{comment.content}</p>
                <small className="text-muted">{new Date(comment.createdAt).toLocaleString()}</small>
                <button 
                  className="btn btn-sm btn-outline-primary ms-2" 
                  onClick={() => comment.isLiked ? unlikeComment(comment.id) : likeComment(comment.id)}
                >
                  <Heart size={16} fill={comment.isLiked ? '#007bff' : 'none'} /> {comment.likes}
                </button>
                {user && user.sub === comment.userId && (
                  <>
                    <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => editComment(comment.id, comment.content)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => deleteComment(comment.id)}>Delete</button>
                  </>
                )}
              </div>
            ))}
            {user && (
              <form onSubmit={handleCommentSubmit}>
                <div className="mb-3">
                  <label htmlFor="comment" className="form-label">Add a comment</label>
                  <textarea
                    className="form-control"
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Submit Comment</button>
              </form>
            )}
          </div>
          
          {recipe.author && (
            <div className="mt-4">
              <h4>Recipe by: {recipe.author.name}</h4>
              <FollowButton userId={recipe.author.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

# app\recipe\[title]\[cookingTime]\RecipeSkeleton.tsx

```tsx
import ContentLoader from 'react-content-loader';

export  const RecipeSkeleton = () => (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <ContentLoader 
            speed={2}
            width={400}
            height={400}
            viewBox="0 0 400 400"
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            <rect x="0" y="0" rx="5" ry="5" width="320" height="200" />
            <rect x="0" y="220" rx="5" ry="5" width="320" height="20" />
            <rect x="0" y="250" rx="5" ry="5" width="200" height="20" />
          </ContentLoader>
        </div>
        <div className="col-md-6">
          <ContentLoader 
            speed={2}
            width={400}
            height={400}
            viewBox="0 0 400 400"
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            <rect x="0" y="0" rx="5" ry="5" width="300" height="30" />
            <rect x="0" y="50" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="70" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="90" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="110" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="130" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="160" rx="5" ry="5" width="300" height="30" />
            <rect x="0" y="200" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="220" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="240" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="260" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="280" rx="5" ry="5" width="350" height="10" />
          </ContentLoader>

        </div>
      </div>
    </div>
  );
```

# app\recipes\page.tsx

```tsx
"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Recipe } from '../types';
import { RecipeCard } from '../Components/RecipeCard';
import { RecipeSkeleton } from './RecipeSkeleton';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("something healthy for dinner");
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const { user } = useUser();

  useEffect(() => {
    if (query) {
      fetchRecipes(query);
    }
  }, [query]);

  const fetchRecipes = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/getRecipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
    setLoading(false);
  };

  const fetchOtherRecipes = async () => {
    if (query) {
      setLoading(true);
      try {
        const response = await fetch('/api/suggestOtherRecipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, avoid: recipes }),
        });
        const data = await response.json();
        setRecipes(data.recipes);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
      setLoading(false);
    }
  };

  if (loading) return <RecipeSkeleton />;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">AI Generated Recipes</h1>
      <div className="row">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
      <div className="d-flex justify-content-center">
        <button 
          onClick={() => query && fetchOtherRecipes()}
          className="btn btn-primary w-50 mt-4"
        >
          I don't like these
        </button>
      </div>
      {user && (
        <div className="mt-4">
          <h2>Your Custom Recipes</h2>
          {/* Display user's custom recipes here */}
        </div>
      )}
    </div>
  );
}
```

# app\recipes\RecipeSkeleton.tsx

```tsx
import React from 'react';
import ContentLoader from 'react-content-loader';

export const RecipeSkeleton = () => (
  <div className="container mt-5">
    <div className="row">
      <ContentLoader 
        speed={2}
        width={400}
        height={500}
        viewBox="0 0 400 500"
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        <rect x="0" y="0" rx="5" ry="5" width="350" height="70" />
        <rect x="0" y="90" rx="5" ry="5" width="350" height="70" />
        <rect x="0" y="180" rx="5" ry="5" width="350" height="70" />
        <rect x="0" y="270" rx="5" ry="5" width="350" height="70" />
        <rect x="0" y="360" rx="5" ry="5" width="350" height="70" />
      </ContentLoader>
    </div>
  </div>
);

export default RecipeSkeleton;

```

# app\social-feed\page.tsx

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  recipeId: string;
  recipeTitle: string;
  timestamp: string;
}

export default function SocialFeed() {
  const { user, isLoading } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/socialFeed');
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      const data = await response.json();
      setActivities(data.activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Failed to load social feed');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view the social feed.</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1>Social Feed</h1>
      {activities.length === 0 ? (
        <p>No recent activities from your network.</p>
      ) : (
        <ul className="list-group">
          {activities.map((activity) => (
            <li key={activity.id} className="list-group-item">
              <strong>{activity.userName}</strong> {activity.action}{' '}
              <Link href={`/recipe/${activity.recipeId}`}>
                {activity.recipeTitle}
              </Link>
              <br />
              <small className="text-muted">{new Date(activity.timestamp).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

# app\types\index.ts

```ts


export interface FavouriteRecipeComponentProps {
  recipe: Recipe;
  favorites: Recipe[];
  setFavorites: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

export interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
  };
  likes: number;
  isLiked: boolean;
  createdAt: string;
  userId: string;
  updatedAt: string;
}

export interface Recipe {
  comments: any;
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  imageUrl?: string;
  imageUrlLarge?: string;
  authorId: string;
  author?: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: 'free' | 'premium';
}

export interface FavouriteRecipeComponentProps {
  recipe: Recipe;
  favorites: Recipe[];
  setFavorites: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  recipeId: string;
  recipeTitle: string;
  timestamp: string;
}

export interface MealPlan {
  id: string;
  date: string;
  recipe: Recipe;
}



```

# next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.

```

# next.config.mjs

```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
};

export default nextConfig;

```

# package.json

```json
{
  "name": "react-challenge",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@auth0/auth0-react": "^2.2.4",
    "@auth0/nextjs-auth0": "^3.5.0",
    "@preact/signals-react": "^2.2.0",
    "@prisma/client": "^5.21.1",
    "ai-digest": "^1.0.7",
    "axios": "^1.7.7",
    "bootstrap": "^5.3.3",
    "lucide-react": "^0.447.0",
    "next": "14.2.14",
    "openai": "^4.67.0",
    "pg": "^8.13.0",
    "react": "^18",
    "react-beautiful-dnd": "^13.1.1",
    "react-content-loader": "^7.0.2",
    "react-dom": "^18",
    "react-feather": "^2.0.10",
    "stripe": "^17.2.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-beautiful-dnd": "^13.1.8",
    "@types/react-dom": "^18",
    "@types/uuid": "^10.0.0",
    "eslint": "^8",
    "eslint-config-next": "14.2.14",
    "prisma": "^5.21.0",
    "typescript": "^5"
  }
}

```

# prisma\migrations\20241016153615_init\migration.sql

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'free',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ingredients" TEXT[],
    "instructions" TEXT[],
    "cookingTime" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_recipeId_key" ON "Favorite"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

```

# prisma\migrations\20241016162044_add_comments_and_activities\migration.sql

```sql
-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

```

# prisma\migrations\20241018111552_add_large_image_url\migration.sql

```sql
-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "imageUrlLarge" TEXT;

```

# prisma\migrations\20241018165443_make_updatedat_optional\migration.sql

```sql
-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_userId_commentId_key" ON "CommentLike"("userId", "commentId");

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

```

# prisma\migrations\20241018200040_cascade_delete_comment_likes\migration.sql

```sql
-- DropForeignKey
ALTER TABLE "CommentLike" DROP CONSTRAINT "CommentLike_commentId_fkey";

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

```

# prisma\migrations\migration_lock.toml

```toml
# Please do not edit this file manually
# It should be added in your version-control system (i.e. Git)
provider = "postgresql"
```

# prisma\schema.prisma

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema
// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                 String        @id
  email              String        @unique
  name               String?
  recipes            Recipe[]
  favorites          Favorite[]
  following          Follow[]      @relation("UserFollowing")
  followers          Follow[]      @relation("UserFollowers")
  mealPlans          MealPlan[]
  subscriptionStatus String        @default("free")
  comments           Comment[]
  activities         Activity[]
  CommentLike        CommentLike[]
}

model Recipe {
  id            String     @id @default(cuid())
  title         String
  ingredients   String[]
  instructions  String[]
  cookingTime   Int
  imageUrl      String?
  imageUrlLarge String? // New field added
  author        User       @relation(fields: [authorId], references: [id])
  authorId      String
  favorites     Favorite[]
  mealPlans     MealPlan[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  comments      Comment[]
  activities    Activity[]
}

model Favorite {
  id       String @id @default(cuid())
  user     User   @relation(fields: [userId], references: [id])
  userId   String
  recipe   Recipe @relation(fields: [recipeId], references: [id])
  recipeId String
  @@unique([userId, recipeId])
}

model Follow {
  id          String @id @default(cuid())
  follower    User   @relation("UserFollowing", fields: [followerId], references: [id])
  followerId  String
  following   User   @relation("UserFollowers", fields: [followingId], references: [id])
  followingId String
  @@unique([followerId, followingId])
}

model MealPlan {
  id       String   @id @default(cuid())
  user     User     @relation(fields: [userId], references: [id])
  userId   String
  date     DateTime
  recipe   Recipe   @relation(fields: [recipeId], references: [id])
  recipeId String
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime? @default(now())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  recipe    Recipe   @relation(fields: [recipeId], references: [id])
  recipeId  String
  likes     CommentLike[] @relation("CommentLikes")
}


model CommentLike {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  comment   Comment  @relation("CommentLikes", fields: [commentId], references: [id], onDelete: Cascade)
  commentId String
  createdAt DateTime @default(now())
  @@unique([userId, commentId])
}

model Activity {
  id        String   @id @default(cuid())
  action    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  recipe    Recipe   @relation(fields: [recipeId], references: [id])
  recipeId  String
}

```

# query

```
postgresql

```

# README.md

```md
# Recipe Management Application

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Technologies](#technologies)
4. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
5. [Usage](#usage)
6. [API Routes](#api-routes)
7. [Database Schema](#database-schema)
8. [Authentication](#authentication)
9. [Contributing](#contributing)
10. [License](#license)

## Introduction

This Recipe Management Application is a full-stack web application built with Next.js, React, and TypeScript. It allows users to discover, save, and share recipes, as well as plan meals and interact with other users through a social feed.

## Features

- User authentication with Auth0
- Recipe search and discovery
- Favorite recipes
- Social features (follow users, activity feed)
- Commenting system
- Meal planning
- Premium subscription features

## Technologies

- Next.js 14.2
- React 18
- TypeScript
- Prisma (ORM)
- PostgreSQL
- Auth0 (Authentication)
- Stripe (Payment processing)
- Bootstrap 5 (Styling)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
   \`\`\`
   git clone https://github.com/olteanalexandru/diet_planner.git
   cd recipe-management-app
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

3. Set up your environment variables (see [Environment Variables](#environment-variables) section).

4. Run Prisma migrations:
   \`\`\`
   npx prisma migrate dev
   \`\`\`

5. Start the development server:
   \`\`\`
   npm run dev
   \`\`\`

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`
DATABASE_URL="postgresql://username:password@localhost:5432/recipe_db"
AUTH0_SECRET='your_auth0_secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your_client_id'
AUTH0_CLIENT_SECRET='your_client_secret'
OPENAI_API_KEY='your_openai_api_key'
PEXELS_API_KEY='your_pexels_api_key'
STRIPE_SECRET_KEY='your_stripe_secret_key'
STRIPE_PRICE_ID='your_stripe_price_id'
\`\`\`

Replace the placeholder values with your actual credentials.

## Usage

After starting the development server, open your browser and navigate to `http://localhost:3000`. You can now use the application to search for recipes, save favorites, plan meals, and interact with other users.

## API Routes

- `/api/auth/*`: Auth0 authentication routes
- `/api/recipes`: CRUD operations for recipes
- `/api/comments`: Get and post comments
- `/api/followUsers`: Follow/unfollow users
- `/api/mealPlanning`: Manage meal plans
- `/api/premium`: Handle premium subscriptions
- `/api/socialFeed`: Get user activity feed

## Database Schema

The main entities in the database are:
- User
- Recipe
- Comment
- Follow
- MealPlan
- Activity

Refer to the `prisma/schema.prisma` file for detailed schema information.

## Authentication

This application uses Auth0 for user authentication. Users can sign up and log in using their email or social accounts configured in your Auth0 application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.




```

# test-connection.js

```js

const { Client } = require('pg')

const client = new Client({
  user: 'Florin',
  host: 'localhost',
  database: 'recipe_app',
  password: 'Delaunulaopt123.',
  port: 5432,
})

client.connect()
  .then(() => console.log('Connected successfully'))
  .catch(e => console.error('Connection error', e))
  .finally(() => client.end())
```

# tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

