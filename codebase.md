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

# .npmrc

```
��e n g i n e - s t r i c t = f a l s e  
 
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

    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { likes: true },
    });

    return NextResponse.json({ likes: updatedComment?.likes.length || 0 });
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

    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { likes: true },
    });

    return NextResponse.json({ likes: updatedComment?.likes.length || 0 });
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

const MAX_COMMENT_LENGTH = 500;

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

    // Check comment length
    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: 'Comment exceeds maximum length' }, { status: 400 });
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
        isEdited: updatedComment.createdAt.getTime() !== (updatedComment.updatedAt?.getTime() ?? updatedComment.createdAt.getTime()),
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

const MAX_COMMENTS = 5;
const MAX_COMMENT_LENGTH = 500;

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

    // Check comment length
    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: 'Comment exceeds maximum length' }, { status: 400 });
    }

    // Check comment count
    const commentCount = await prisma.comment.count({ where: { recipeId } });
    if (commentCount >= MAX_COMMENTS) {
      return NextResponse.json({ error: 'Maximum number of comments reached' }, { status: 400 });
    }

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
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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

  const { title, cookingTime, imageUrl } = requestBody;

  if (!title || !cookingTime) {
    return NextResponse.json({ error: 'Missing title or cookingTime in request body' }, { status: 400 });
  }

  const normalisedTitle = normalizeTitle(title);

  let attempts = 0;
  while (attempts < MAX_RETRIES) {
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

      // Create activity only for authenticated users
      await prisma.activity.create({
        data: {
          action: 'generated',
          user: { connect: { id: user.id } },
          recipe: { connect: { id: recipe.id } },
        },
      });

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
import { Heart, Edit2, Trash2, X, Check } from 'lucide-react';
import Link from 'next/link';

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
  onDelete?: (commentId: string) => void;
  onEdit?: (commentId: string, newContent: string) => void;
  onLike?: (commentId: string) => void;
  onUnlike?: (commentId: string) => void;
}

export const Comment: React.FC<CommentProps> = ({ 
  comment, 
  onDelete, 
  onEdit, 
  onLike, 
  onUnlike 
}) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const isEdited = new Date(comment.updatedAt).getTime() !== new Date(comment.createdAt).getTime();

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(comment.id, editedContent);
      setIsEditing(false);
    }
  };

  const handleLikeToggle = () => {
    if (!user) return; // Prevent unauthenticated users from liking
    if (comment.isLiked && onUnlike) {
      onUnlike(comment.id);
    } else if (!comment.isLiked && onLike) {
      onLike(comment.id);
    }
  };

  return (
    <div className="p-4">
      {isEditing ? (
        <div className="space-y-4">
          <textarea
            className="form-textarea"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSaveEdit}
              className="btn-primary flex items-center"
            >
              <Check size={16} className="mr-1" />
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="btn-secondary flex items-center"
            >
              <X size={16} className="mr-1" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-2">
              <Link
                  href={`/profile/${comment.user.id}`}
                  className="font-medium text-cyber-primary hover:text-cyber-accent transition-colors duration-200"
                >
                  {comment.user.name}
                </Link>

                {/* <span className="font-medium text-gray-100">{comment.user.name}</span> */}
                {isEdited && (
                  <span className="text-xs text-gray-500">(edited)</span>
                )}
              </div>
              <p className="text-gray-300">{comment.content}</p>
            </div>
            
            {user && user.sub === comment.user.id && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-cyber-primary transition-colors duration-200"
                >
                  <Edit2 size={16} />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={handleLikeToggle}
              className="flex items-center space-x-1 text-gray-400 hover:text-cyber-primary transition-colors duration-200"
            >
              <Heart
                size={16}
                className={comment.isLiked ? 'text-cyber-primary fill-current' : ''}
              />
              <span>{comment.likes}</span>
            </button>
            <span className="text-gray-500 text-sm">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
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
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-100">
        <span className="bg-gradient-to-r from-cyber-primary to-cyber-accent bg-clip-text text-transparent">
          Your Favorites
        </span>
      </h2>
      <div className="grid gap-4">
        {favorites.map((fav) => (
          <div 
            key={fav.id} 
            className="card-cyber flex items-center space-x-4 p-4 hover:scale-[1.01] transition-transform duration-200"
          >
            <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-lg">
              <img
                src={fav.imageUrl}
                alt={fav.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-grow">
              <Link 
                href={`/recipe/${fav.title}/${fav.cookingTime}`}
                className="text-lg font-medium text-gray-100 hover:text-cyber-primary transition-colors duration-200"
              >
                {fav.title}
              </Link>
              <p className="text-gray-400">{fav.cookingTime} minutes</p>
            </div>
            <button
              className="p-2 rounded-lg text-cyber-primary hover:bg-cyber-primary/10 transition-colors duration-200"
              onClick={() => removeFavorite(fav)}
            >
              <Heart size={24} fill="currentColor" />
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

const Header: React.FC = () => {
  return (
    <header className="relative z-20 border-b border-space-700 bg-space-800/50 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold bg-gradient-to-r from-cyber-primary via-cyber-glow to-cyber-accent bg-clip-text text-transparent">
              FutureRecipes
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/dashboard" 
              className="text-gray-300 hover:text-cyber-primary transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-space-700"
            >
              Dashboard
            </Link>
            <Link 
              href="/create-recipe" 
              className="text-gray-300 hover:text-cyber-primary transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-space-700"
            >
              Create Recipe
            </Link>
            <Link 
              href="/social-feed" 
              className="text-gray-300 hover:text-cyber-primary transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-space-700"
            >
              Social Feed
            </Link>
            <div className="pl-6 border-l border-space-600">
              <LoginButton />
            </div>
          </nav>
          
          <button className="md:hidden text-gray-300 hover:text-cyber-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
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

# app\Components\recipes\Recipe.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Comment } from '../Comment';
import { Recipe as RecipeType, Comment as CommentType } from '../../types';

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

# app\Components\recipes\RecipeCard.tsx

```tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Clock, ChevronRight } from 'lucide-react';
import { Recipe } from '../../types';
import { useFavorites } from '../../context/FavoritesContext';

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
      setError('Failed to update favorite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="card-cyber group relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px]">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4">
          {/* Image Container */}
          <div className="w-full md:w-48 h-48 md:h-32 relative rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={recipe.imageUrl || '/placeholder-recipe.jpg'}
              alt={recipe.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Content Container */}
          <div className="flex-grow min-w-0 w-full">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-grow space-y-2">
                <Link 
                  href={`/recipe/${recipe.title}/${recipe.cookingTime}`}
                  className="block text-xl font-semibold text-gray-100 hover:text-cyber-primary line-clamp-2 transition-colors duration-200"
                >
                  {recipe.title}
                </Link>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-gray-400">
                    <Clock size={16} className="mr-1" />
                    <span>{recipe.cookingTime} minutes</span>
                  </div>
                  {recipe.author && (
                    <div className="text-sm text-gray-400">
                      by <span className="text-cyber-primary">{recipe.author.name}</span>
                    </div>
                  )}
                </div>

                {/* Preview Content  -- MIGHT WANT TO ALSO ADD INGREDIENTS IN THE FUTURE*/}
                <div className="text-gray-400 text-sm line-clamp-2">
                  {recipe.ingredients?.slice(0, 3).join(', ')}
                  {recipe.ingredients?.length > 3 && '...'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col items-center gap-2">
                <button
                  onClick={toggleFavorite}
                  disabled={isLoading}
                  className="btn-cyber-outline p-2"
                >
                  <Heart
                    size={20}
                    fill={isFavorite(recipe) ? 'currentColor' : 'none'}
                    className={isLoading ? 'animate-pulse' : ''}
                  />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-2 text-xs text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Hover Effect Link */}
        <div className="absolute inset-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none pr-4">
          <ChevronRight className="text-cyber-primary" size={24} />
        </div>
      </div>
    </div>
  );
};
```

# app\Components\recipes\RecipeForm.tsx

```tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Loader2, ImagePlus } from 'lucide-react';

export const RecipeForm = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [cookingTime, setCookingTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          cookingTime: parseInt(cookingTime),
          imageUrl
        }),
      });
      
      if (response.ok) {
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* Title & Time */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="form-group">
          <label htmlFor="title" className="form-label">Recipe Title</label>
          <input
            type="text"
            id="title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter recipe title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cookingTime" className="form-label">Cooking Time (minutes)</label>
          <input
            type="number"
            id="cookingTime"
            className="form-input"
            value={cookingTime}
            onChange={(e) => setCookingTime(e.target.value)}
            placeholder="Enter cooking time"
            required
          />
        </div>
      </div>

      {/* Image URL */}
      <div className="form-group">
        <label htmlFor="imageUrl" className="form-label">Image URL</label>
        <div className="relative">
          <input
            type="url"
            id="imageUrl"
            className="form-input pl-10"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL"
          />
          <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Ingredients */}
      <div className="form-group">
        <div className="flex justify-between items-center mb-4">
          <label className="form-label m-0">Ingredients</label>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="btn-cyber-outline py-1 px-2"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                className="form-input"
                value={ingredient}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                placeholder={`Ingredient ${index + 1}`}
                required
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="btn-cyber-outline py-2 px-2"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="form-group">
        <div className="flex justify-between items-center mb-4">
          <label className="form-label m-0">Instructions</label>
          <button
            type="button"
            onClick={handleAddInstruction}
            className="btn-cyber-outline py-1 px-2"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-2">
              <textarea
                className="form-textarea"
                value={instruction}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
                required
              />
              {instructions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveInstruction(index)}
                  className="btn-cyber-outline py-2 px-2"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-cyber px-8 py-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Recipe...
            </>
          ) : (
            'Create Recipe'
          )}
        </button>
      </div>
    </form>
  );
};
```

# app\Components\recipes\RecipeSkeleton.tsx

```tsx
import React from 'react';

export const RecipeCardSkeleton = () => (
  <div className="w-full">
    <div className="card-cyber group relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4">
        {/* Image Skeleton */}
        <div className="w-full md:w-48 h-48 md:h-32 relative rounded-lg overflow-hidden flex-shrink-0 bg-space-700 animate-pulse" />

        {/* Content Skeleton */}
        <div className="flex-grow min-w-0 w-full">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-grow space-y-2">
              {/* Title Skeleton */}
              <div className="h-7 bg-space-700 animate-pulse rounded w-3/4" />
              
              {/* Meta Info Skeleton */}
              <div className="flex items-center gap-4 mt-2">
                <div className="h-5 bg-space-700 animate-pulse rounded w-24" />
                <div className="h-5 bg-space-700 animate-pulse rounded w-32" />
              </div>

              {/* Preview Content Skeleton */}
              <div className="space-y-1 mt-2">
                <div className="h-4 bg-space-700 animate-pulse rounded w-full" />
                <div className="h-4 bg-space-700 animate-pulse rounded w-5/6" />
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className="flex md:flex-col items-center gap-2">
              <div className="w-8 h-8 bg-space-700 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const RecipeGridSkeleton = () => (
  <div className="grid gap-6">
    {[1, 2, 3, 4, 5].map((index) => (
      <RecipeCardSkeleton key={index} />
    ))}
  </div>
);

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

# app\Components\user\ProfileHeader.tsx

```tsx
import React from 'react';
import { User} from '../../types';
import { UserStatsCard } from './UserStats';
import { FollowButton } from '../FollowButton';
import { formatDistance } from 'date-fns';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Edit2, Calendar, Users, BookOpen } from 'lucide-react';

interface ProfileHeaderProps {
  profile: User;
  recipeCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  onFollowToggle: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  recipeCount,
  followersCount,
  followingCount,
  isFollowing,
  onFollowToggle,
}) => {
  const { user } = useUser();
  const isOwnProfile = user?.sub === profile.id;

  return (
    <div className="card-cyber p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-cyber-primary/10 flex items-center justify-center">
            <span className="text-3xl">
              {profile.name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        </div>

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{profile.name}</h1>
              <p className="text-gray-400">Member since {formatDistance(new Date(profile.createdAt), new Date(), { addSuffix: true })}</p>
            </div>
            {!isOwnProfile && <FollowButton userId={profile.id} isFollowing={isFollowing} onToggle={onFollowToggle} />}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <UserStatsCard icon={<BookOpen />} label="Recipes" value={recipeCount} />
            <UserStatsCard icon={<Users />} label="Followers" value={followersCount} />
            <UserStatsCard icon={<Users />} label="Following" value={followingCount} />
          </div>

          {profile.bio && (
            <p className="mt-4 text-gray-300">{profile.bio}</p>
          )}

          {isOwnProfile && (
            <Link 
              href="/settings/profile" 
              className="mt-4 btn-cyber-outline inline-flex items-center"
            >
              <Edit2 size={16} className="mr-2" />
              Edit Profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};






```

# app\Components\user\UserProfileSkeleton.tsx

```tsx
export const UserProfileSkeleton: React.FC = () => (
    <div className="space-y-8 animate-pulse">
      <div className="card-cyber p-6">
        <div className="flex gap-6">
          <div className="w-24 h-24 rounded-full bg-space-700" />
          <div className="flex-grow space-y-4">
            <div className="h-8 w-48 bg-space-700 rounded" />
            <div className="h-4 w-32 bg-space-700 rounded" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-space-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-space-700 rounded" />
        ))}
      </div>
    </div>
  );
```

# app\Components\user\UserRecipes.tsx

```tsx
import { Recipe } from '@/app/types';
import { RecipeCard } from '../recipes/RecipeCard';

export const UserRecipes: React.FC<{ recipes: Recipe[] }> = ({ recipes }) => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-100">Recipes</h2>
      {recipes.length > 0 ? (
        <div className="grid gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No recipes yet</p>
      )}
    </div>
  );
```

# app\Components\user\UserStats.tsx

```tsx




export const UserStatsCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({
    icon,
    label,
    value
  }) => (
    <div className="flex flex-col items-center p-4 rounded-lg bg-space-800">
      <div className="text-cyber-primary mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-100">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
```

# app\context\CommentContext.tsx

```tsx
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
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
      const response = await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
      const data = await response.json();
      setComments(prevComments => prevComments.map(comment => 
        comment.id === commentId ? { ...comment, likes: data.likes, isLiked: true } : comment
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const unlikeComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, { method: 'DELETE' });
      const data = await response.json();
      setComments(prevComments => prevComments.map(comment => 
        comment.id === commentId ? { ...comment, likes: data.likes, isLiked: false } : comment
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
import { RecipeForm } from '../Components/recipes/RecipeForm';
import { Loader2 } from 'lucide-react';

export default function CreateRecipe() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-center min-h-[60vh] flex-col gap-4">
        <h2 className="text-2xl font-bold text-gray-100">Please log in to create a recipe</h2>
        <a href="/api/auth/login" className="btn-cyber">
          Log In
        </a>
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="page-title">Create a New Recipe</h1>
            <p className="text-gray-400">Share your culinary masterpiece with the world</p>
          </div>
          
          <div className="card-cyber p-8">
            <RecipeForm />
          </div>
        </div>
      </div>
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
import { RecipeCard } from '../Components/recipes/RecipeCard';
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
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-geist-sans: 'Geist', sans-serif;
  --font-geist-mono: 'Geist Mono', monospace;
}

@layer base {
  body {
    @apply antialiased;
  }
}

@layer components {
  .btn-cyber {
    @apply px-6 py-2 rounded-lg bg-cyber-primary text-space-900 font-medium
    transition-all duration-300 hover:shadow-neon hover:scale-105
    focus:outline-none focus:ring-2 focus:ring-cyber-primary/50;
  }

  .btn-cyber-outline {
    @apply px-6 py-2 rounded-lg border border-cyber-primary text-cyber-primary
    transition-all duration-300 hover:bg-cyber-primary/10
    focus:outline-none focus:ring-2 focus:ring-cyber-primary/50;
  }

  .card-cyber {
    @apply bg-space-800/50 backdrop-blur-sm border border-space-700
    rounded-lg p-6 transition-all duration-300
    hover:border-cyber-primary/50 hover:shadow-lg;
  }

  .input-cyber {
    @apply bg-space-700 border border-space-600 rounded-lg px-4 py-2
    text-gray-100 placeholder-gray-400
    focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary
    transition-all duration-200;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-space-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-space-600 rounded-full hover:bg-cyber-primary transition-colors duration-200;
}

/* Glowing text effect */
.glow-text {
  text-shadow: 0 0 10px theme('colors.cyber.primary'),
               0 0 20px theme('colors.cyber.primary'),
               0 0 30px theme('colors.cyber.primary');
}

/* Grid background pattern */
.grid-pattern {
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}


@layer components {
  .page-container {
    @apply max-w-7xl mx-auto px-4 py-8;
  }

  .page-title {
    @apply text-3xl font-bold mb-8 bg-gradient-to-r from-cyber-primary to-cyber-accent bg-clip-text text-transparent;
  }

  .section-title {
    @apply text-2xl font-bold mb-6 text-gray-100;
  }

  .grid-container {
    @apply grid gap-6 md:grid-cols-2 lg:grid-cols-3;
  }

  .form-group {
    @apply space-y-2 mb-6;
  }

  .form-label {
    @apply block text-sm font-medium text-gray-300;
  }

  .form-input {
    @apply input-cyber w-full;
  }

  .form-textarea {
    @apply input-cyber w-full min-h-[100px] resize-y;
  }

  .btn-primary {
    @apply btn-cyber;
  }

  .btn-secondary {
    @apply btn-cyber-outline;
  }

  .card {
    @apply card-cyber;
  }

  .link {
    @apply text-cyber-primary hover:text-cyber-accent transition-colors duration-200;
  }

  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
    bg-cyber-primary/10 text-cyber-primary;
  }

  .alert {
    @apply p-4 rounded-lg border;
  }

  .alert-success {
    @apply border-green-500/20 bg-green-500/10 text-green-400;
  }

  .alert-error {
    @apply border-red-500/20 bg-red-500/10 text-red-400;
  }
}


@layer utilities {
  .flex-center {
    @apply flex items-center justify-center;
  }

  .absolute-center {
    @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
  }

  .grid-auto-fit {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6;
  }

  .text-gradient {
    @apply bg-gradient-to-r from-cyber-primary to-cyber-accent bg-clip-text text-transparent;
  }

  .card-hover {
    @apply transition-all duration-300 hover:scale-[1.02] hover:shadow-neon;
  }

  .input-focus {
    @apply focus:ring-2 focus:ring-cyber-primary/50 focus:border-cyber-primary;
  }
}

/* Improved scrollbar */
::-webkit-scrollbar {
  @apply w-2;
}

::-webkit-scrollbar-track {
  @apply bg-space-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-space-600 rounded-full transition-colors duration-200;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-cyber-primary;
}

/* Loading animation */
@keyframes glow {
  0%, 100% {
    opacity: 1;
    text-shadow: 0 0 10px theme('colors.cyber.primary');
  }
  50% {
    opacity: 0.5;
    text-shadow: 0 0 20px theme('colors.cyber.primary');
  }
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}

/* Glass effect */
.glass {
  @apply bg-space-800/30 backdrop-blur-md border border-space-700/50;
}

/* Image hover effect */
.image-hover {
  @apply transition-transform duration-300 hover:scale-105;
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
import { FavoritesProvider } from './context/FavoritesContext';
import { RecipeProvider } from './context/RecipeContext';
import { CommentProvider } from './context/CommentContext';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import Header from './Components/Header';

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
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} 
        bg-gradient-to-b from-space-800 to-space-900 
        text-gray-100 min-h-screen
        font-geist-sans antialiased selection:bg-cyber-primary/20 selection:text-cyber-primary`}>
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
        <div className="fixed inset-0 bg-gradient-to-tr from-cyber-primary/5 via-transparent to-cyber-accent/5"></div>
        
        {/* Main Content */}
        <UserProvider>
          <RecipeProvider>
            <CommentProvider>
              <FavoritesProvider>
                <div className="relative z-10 flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow container mx-auto px-4 py-8">
                    <div className="max-w-7xl mx-auto">
                      {children}
                    </div>
                  </main>
                  <footer className="border-t border-space-700 bg-space-800/50 backdrop-blur-sm py-6">
                    <div className="container mx-auto px-4 text-center text-space-300 text-sm">
                      <p>© {new Date().getFullYear()} FutureRecipes. All rights reserved.</p>
                    </div>
                  </footer>
                </div>
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
import { Search } from 'lucide-react';
import Favorites from './Components/Favorites';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const router = useRouter();
   
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/recipes/?query=${encodeURIComponent(query)}`);
  };
  
  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-bold">
          <span className="bg-gradient-to-r from-cyber-primary via-cyber-glow to-cyber-accent bg-clip-text text-transparent">
            Discover the Future
          </span>
          <br />
          <span className="text-gray-100">of Cooking</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Explore AI-powered recipes tailored to your taste, and join a community of future-forward food enthusiasts.
        </p>
      </div>

      {/* Search Section */}
      <div className="w-full max-w-2xl mx-auto px-4">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            className="input-cyber w-full h-14 pl-5 pr-12 text-lg"
            placeholder="What do you feel like eating?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg 
              text-cyber-primary hover:bg-cyber-primary/10 transition-colors duration-200"
          >
            <Search size={24} />
          </button>
        </form>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto px-4">
        {['AI-Powered Recipes', 'Smart Meal Planning', 'Social Cooking'].map((feature, index) => (
          <div key={index} className="card-cyber group">
            <div className="h-12 w-12 rounded-lg bg-cyber-primary/10 mb-4 flex items-center justify-center group-hover:bg-cyber-primary/20 transition-colors duration-200">
              <span className="text-2xl">{['🤖', '📅', '👥'][index]}</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-100 mb-2">{feature}</h3>
            <p className="text-gray-400">Experience the next generation of cooking with our innovative features.</p>
          </div>
        ))}
      </div>

      {/* Favorites Section */}
      <div className="w-full max-w-5xl mx-auto px-4">
        <Favorites />
      </div>
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
import { Recipe, User } from '../../types';
import { ProfileHeader, UserRecipes, UserProfileSkeleton } from '../../Components/profile';

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserRecipes();
      if (currentUser) {
        checkFollowStatus();
        fetchFollowCounts();
      }
    }
  }, [userId, currentUser]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user profile');
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
      if (!response.ok) throw new Error('Failed to fetch user recipes');
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      setError('Failed to load user recipes');
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/followUsers?followingId=${userId}`);
      if (!response.ok) throw new Error('Failed to check follow status');
      const data = await response.json();
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const response = await fetch(`/api/followCounts/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch follow counts');
      const data = await response.json();
      setFollowersCount(data.followersCount);
      setFollowingCount(data.followingCount);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/followUsers', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });
      
      if (!response.ok) throw new Error('Failed to update follow status');
      
      setIsFollowing(!isFollowing);
      fetchFollowCounts();
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  if (isLoading) return <UserProfileSkeleton />;
  if (error) return <div className="alert-error p-4 rounded-lg">{error}</div>;
  if (!profile) return <div className="alert-error p-4 rounded-lg">User not found</div>;

  return (
    <div className="page-container space-y-8">
      <ProfileHeader
        profile={profile}
        recipeCount={recipes.length}
        followersCount={followersCount}
        followingCount={followingCount}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
      />
      <UserRecipes recipes={recipes} />
    </div>
  );
}
```

# app\public\grid.svg

This is a file of the type: SVG Image

# app\recipe\[title]\[cookingTime]\page.tsx

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe, Comment as CommentType } from '../../../types';
//import { RecipeSkeleton } from './RecipeSkeleton';
import { FollowButton } from '../../../Components/FollowButton';
import { Heart, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useFavorites } from '../../../context/FavoritesContext';
import { useRecipes } from '../../../context/RecipeContext';
import { useComments } from '../../../context/CommentContext';
import { Comment } from '../../../Components/Comment';

const MAX_COMMENTS = 5;
const MAX_COMMENT_LENGTH = 500;

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
  }, [title, cookingTime]);

  const toggleFavorite = async () => {
    if (!recipe || !user) return;
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
    if (newComment.length > MAX_COMMENT_LENGTH) {
      alert(`Comment is too long. Maximum length is ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }
    if (comments.length >= MAX_COMMENTS) {
      alert(`Maximum number of comments (${MAX_COMMENTS}) reached.`);
      return;
    }
    await addComment(recipe.id, newComment);
    setNewComment('');
  };

  const handleCommentEdit = async (commentId: string, content: string) => {
    if (content.length > MAX_COMMENT_LENGTH) {
      alert(`Comment is too long. Maximum length is ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }
    await editComment(commentId, content);
  };

  if (loading) {
    return (
      <div className="flex-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="alert-error p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="alert-error p-4 rounded-lg">
          Recipe not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {isEditing ? (
        <div className="card-cyber p-6">
          <h1 className="text-2xl font-bold mb-6">Edit Recipe</h1>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
            <div className="space-y-6">
              <div className="form-group">
                <label htmlFor="title" className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  id="title"
                  value={editedRecipe?.title || ''}
                  onChange={(e) => setEditedRecipe(prev => prev ? {...prev, title: e.target.value} : null)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cookingTime" className="form-label">Cooking Time (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  id="cookingTime"
                  value={editedRecipe?.cookingTime || ''}
                  onChange={(e) => setEditedRecipe(prev => prev ? {...prev, cookingTime: e.target.value} : null)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ingredients" className="form-label">Ingredients</label>
                <textarea
                  className="form-textarea"
                  id="ingredients"
                  value={editedRecipe?.ingredients.join('\n') || ''}
                  onChange={(e) => setEditedRecipe(prev => prev ? {...prev, ingredients: e.target.value.split('\n')} : null)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="instructions" className="form-label">Instructions</label>
                <textarea
                  className="form-textarea"
                  id="instructions"
                  value={editedRecipe?.instructions.join('\n') || ''}
                  onChange={(e) => setEditedRecipe(prev => prev ? {...prev, instructions: e.target.value.split('\n')} : null)}
                />
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn-cyber">Save Changes</button>
                <button type="button" className="btn-cyber-outline" onClick={handleCancelEdit}>Cancel</button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Recipe Header Section */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image Container */}
            <div className="w-full md:w-1/2 lg:w-2/5">
              <div className="card-cyber p-4 h-full">
                <img 
                  src={recipe.imageUrlLarge || '/placeholder.jpg'} 
                  alt={recipe.title}
                  className="w-full h-64 md:h-96 object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Recipe Info Container */}
            <div className="w-full md:w-1/2 lg:w-3/5 space-y-6">
              <div className="card-cyber p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-100">{recipe.title}</h1>
                    <p className="text-gray-400 mt-2">{recipe.cookingTime} minutes</p>
                  </div>
                  {user && (
                    <button
                      onClick={toggleFavorite}
                      className="p-2 rounded-lg hover:bg-space-700 transition-colors duration-200"
                      title={isFavorite(recipe) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart 
                        size={24} 
                        className="text-cyber-primary"
                        fill={isFavorite(recipe) ? 'currentColor' : 'none'} 
                      />
                    </button>
                  )}
                </div>

                {user && user.sub === recipe.authorId && (
                  <div className="flex gap-4 mt-6">
                    <button 
                      className="btn-cyber-outline flex items-center gap-2" 
                      onClick={handleEdit}
                    >
                      <Edit2 size={16} />
                      Edit Recipe
                    </button>
                    <button 
                      className="btn-cyber-outline flex items-center gap-2 text-red-500 hover:bg-red-500/10" 
                      onClick={handleRecipeDelete}
                    >
                      <Trash2 size={16} />
                      Delete Recipe
                    </button>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <div className="card-cyber p-6">
                <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-gray-300">
                      • {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Instructions Section */}
          <div className="card-cyber p-6">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <ol className="space-y-4">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="text-gray-300">
                  <span className="font-semibold text-cyber-primary mr-2">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Comments Section */}
          <div className="card-cyber p-6">
            {user ? (
              <>
                <h3 className="text-xl font-semibold mb-4">
                  Comments ({comments.length}/{MAX_COMMENTS})
                </h3>
                {comments.map((comment: CommentType) => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    onDelete={deleteComment}
                    onEdit={handleCommentEdit}
                    onLike={likeComment}
                    onUnlike={unlikeComment}
                  />
                ))}
                {comments.length < MAX_COMMENTS && (
                  <form onSubmit={handleCommentSubmit} className="mt-6">
                    <div className="space-y-2">
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-300">
                        Add a comment
                      </label>
                      <textarea
                        id="comment"
                        className="form-textarea w-full"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        maxLength={MAX_COMMENT_LENGTH}
                        required
                      />
                      <div className="text-sm text-gray-400">
                        {newComment.length}/{MAX_COMMENT_LENGTH} characters
                      </div>
                    </div>
                    <button type="submit" className="btn-cyber mt-4">
                      Submit Comment
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <h3 className="text-xl font-semibold mb-2">Comments</h3>
                <p className="text-gray-400 mb-4">Sign in to view and post comments</p>
                <a href="/api/auth/login" className="btn-cyber">
                  Sign In
                </a>
              </div>
            )}
          </div>
          
          {/* Author Section */}
          {recipe.author && (
            <div className="card-cyber p-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Recipe by: {recipe.author.name}</h4>
                {user && <FollowButton userId={recipe.author.id} />}
              </div>
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
"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Recipe } from '../types';
import { RecipeCard } from '../Components/recipes/RecipeCard';
import { RecipeGridSkeleton } from '../Components/recipes/RecipeSkeleton';
// import { useUser } from '@auth0/nextjs-auth0/client';
import { Loader2 } from 'lucide-react';

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  // const { user } = useUser();

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
    if (!query) return;
    
    setFetchingMore(true);
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
    } finally {
      setFetchingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex flex-col gap-8">
          <div className="space-y-2">
            <h1 className="page-title">AI Generated Recipes</h1>
            <p className="text-gray-400">
              Searching for: <span className="text-cyber-primary">{query}</span>
            </p>
          </div>
          <RecipeGridSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="page-title">AI Generated Recipes</h1>
          <p className="text-gray-400">
            Searching for: <span className="text-cyber-primary">{query}</span>
          </p>
        </div>

        {/* Recipe Grid */}
        <div className="grid gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button 
            onClick={fetchOtherRecipes}
            disabled={fetchingMore}
            className="btn-cyber relative"
          >
            {fetchingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading more recipes...
              </>
            ) : (
              "Show me different recipes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
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

export interface User {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  createdAt: Date;
  subscriptionStatus: 'free' | 'premium';
}

export interface UserProfile extends User {
  _count: {
    recipes: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  imageUrl?: string;
  imageUrlLarge?: string;
  authorId: string;
  author?: User;
  createdAt: Date;
  updatedAt: Date;
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
  updatedAt: string;
  userId: string;
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
    "date-fns": "^4.1.0",
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
    "autoprefixer": "^10.4.20",
    "eslint": "^8",
    "eslint-config-next": "14.2.14",
    "postcss": "^8.4.47",
    "prisma": "^5.21.0",
    "tailwindcss": "^3.4.14",
    "typescript": "^5"
  }
}

```

# postcss.config.js

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
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

# prisma\migrations\20241019093048_add_comment_likes_relation\migration.sql

```sql
/*
  Warnings:

  - Made the column `updatedAt` on table `Comment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

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
  bio                String?       @default("")
  createdAt          DateTime      @default(now())
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
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  recipe    Recipe   @relation(fields: [recipeId], references: [id])
  recipeId  String
  likes     CommentLike[]
}


model CommentLike {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
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

# tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk-inspired palette
        'cyber': {
          primary: '#0FF4C6',
          secondary: '#7B2CBF',
          accent: '#FF124F',
          dark: '#0A0A0B',
          'dark-800': '#151517',
          'dark-700': '#1E1E21',
          'dark-600': '#2A2A2E',
          glow: '#00F5D4',
        },
        // Futuristic grays
        'space': {
          50: '#EAEAEA',
          100: '#BEBEBF',
          200: '#929293',
          300: '#666667',
          400: '#3D3D3E',
          500: '#242425',
          600: '#1A1A1B',
          700: '#131314',
          800: '#0D0D0E',
          900: '#060607',
        }
      },
      fontFamily: {
        'geist-sans': ['var(--font-geist-sans)'],
        'geist-mono': ['var(--font-geist-mono)'],
      },
      boxShadow: {
        'neon': '0 0 5px theme(colors.cyber.glow), 0 0 20px theme(colors.cyber.glow)',
        'neon-strong': '0 0 10px theme(colors.cyber.glow), 0 0 40px theme(colors.cyber.glow)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 5px theme(colors.cyber.glow), 0 0 20px theme(colors.cyber.glow)',
          },
          '50%': {
            opacity: 0.7,
            boxShadow: '0 0 2px theme(colors.cyber.glow), 0 0 10px theme(colors.cyber.glow)',
          },
        },
      },
    },
  },
  plugins: [],
}


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

