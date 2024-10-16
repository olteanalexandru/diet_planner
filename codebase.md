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

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

```

# app\api\auth\[auth0]\route.ts

```ts
// app/api/auth/[auth0]/route.ts

import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

export const GET = handleAuth({
  callback: async () => {
    const res = await handleCallback();
    
    try {
      // Extract the user information from the session
      const session = await getSession();

      // If we have a session, ensure the user exists in our database
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

      return res;
    } catch (error) {
      console.error('Error in Auth0 callback:', error);
      return Response.redirect(new URL('/api/auth/login', new URL(process.env.AUTH0_BASE_URL || 'http://localhost:3000')));
    }
  }
});

import { getSession } from "@auth0/nextjs-auth0";
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
          recipeId,
          userId: session.user.sub, // Use the Auth0 user ID
        },
        include: { user: { select: { id: true, name: true } } },
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

# app\api\followUsers\route.ts

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

  const { followingId } = req.body;

  try {
    const follow = await prisma.follow.create({
      data: {
        follower: { connect: { email: session.user.email } },
        following: { connect: { id: followingId } },
      },
    });

    res.status(201).json({ follow });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Error following user' });
  }
}
```

# app\api\getRecipeDetails\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';
import { Recipe } from './../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function POST(req: NextRequest) {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      const { title, cookingTime, imageUrl } = await req.json();

      const normalisedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '');

      if (!title || !cookingTime) {
        throw new Error('Missing title or cookingTime in request body');
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that provides recipe details." },
          { role: "user", content: `Provide detailed information for the recipe with title "${normalisedTitle}" and cooking time "${cookingTime}". Include the title, ingredients, and instructions. Return the response as a valid JSON object with the keys: id, title, ingredients, instructions, and cookingTime.` }
        ],
      });

      console.log('Completion response for recipe details:', completion.choices[0].message?.content);

      let recipe: Recipe = {
        id: '',
        title: '',
        ingredients: [],
        instructions: [],
        cookingTime: ''
      };

      try {
        const responseContent = completion.choices[0].message?.content || '{}';
        if (!isValidJSON(responseContent)) {
          throw new Error('Invalid JSON format from OpenAI');
        }
        recipe = JSON.parse(responseContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON format from OpenAI');
      }

      if (!recipe.title || !recipe.cookingTime || !recipe.ingredients.length || !recipe.instructions.length) {
        throw new Error('Incomplete recipe details: ' + JSON.stringify(recipe));
      }

      if (imageUrl) {
        recipe.imageUrl = imageUrl;
      } else {
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

          recipe.imageUrl = response.data.photos[0]?.src?.small || '';
          recipe.imageUrlLarge = response.data.photos[0]?.src?.large || '';
          recipe.cookingTime = cookingTime;
        } catch (error) {
          console.error(`Error fetching image for ${recipe.title}:`, error);
          recipe.imageUrl = '';
        }
      }

      return NextResponse.json({ recipe });
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

// Helper function to validate JSON
function isValidJSON(str: string) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
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

# app\api\recipes\route.ts

```ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST(req: NextApiRequest, res: NextApiResponse) {
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

    const followingIds = following.map((f: { followingId: any; }) => f.followingId);

    const activities = await prisma.activity.findMany({
      where: { userId: { in: followingIds } },
      include: { user: true, recipe: true },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent activities
    });

    const formattedActivities = activities.map((activity: { id: any; userId: any; user: { name: any; }; action: any; recipeId: any; recipe: { title: any; }; createdAt: { toISOString: () => any; }; }) => ({
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
// app/Components/FollowButton.tsx

import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ userId, initialIsFollowing }) => {
  const { user } = useUser();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
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
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
    </button>
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

# app\Components\RecipeCard.tsx

```tsx
'use client';
import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Recipe } from '../types';
import { useFavorites } from '../context/FavoritesContext';

const Heart = dynamic(() => import('lucide-react').then((mod) => mod.Heart), { ssr: false });

interface RecipeCardProps {
  recipe: Recipe
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const toggleFavorite = () => {
    const favoriteRecipe = { ...recipe }; 
    if (isFavorite(favoriteRecipe)) {
      removeFavorite(favoriteRecipe);
    } else {
      addFavorite(favoriteRecipe);
    }
  };

  
  return (
    <div className="d-flex align-items-center bg-light p-3 rounded mb-3" style={{ boxShadow: '0 6px 10px rgba(0, 0, 0, 0.1)', paddingLeft: 0 }}>
      <div style={{ flexShrink: 0, height: '100%' }}>
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="me-3"
          style={{ height: 'auto', borderRadius: '8px' , maxWidth: '80px', maxHeight: '100px' }}
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
      >
        <Heart size={24} color="#65558F" fill={isFavorite({ ...recipe }) ? '#65558F' : 'none'} />
      </button>
    </div>
  );
  
  
};




```

# app\Components\RecipeForm.tsx

```tsx
import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types';

export const RecipeForm: React.FC = () => {
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [cookingTime, setCookingTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
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

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, ingredients, instructions, cookingTime, imageUrl }),
      });
      
      if (response.ok) {
        setSuccess(true);
        setError(null);
        // Clear form
        setTitle('');
        setIngredients(['']);
        setInstructions(['']);
        setCookingTime('');
        setImageUrl('');
      } else {
        const data = await response.json();
        setError(data.error || 'An error occurred while submitting the recipe');
      }
    } catch (error) {
      console.error('Error submitting recipe:', error);
      setError('An error occurred while submitting the recipe');
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

# app\context\FavoritesContext.tsx

```tsx
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe } from '../types';

interface FavoritesContextType {
  favorites: Recipe[];
  addFavorite: (recipe: Recipe) => void;
  removeFavorite: (recipe: Recipe) => void;
  isFavorite: (recipe: Recipe) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Recipe[]>([]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  useEffect(() => {
   localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (recipe: Recipe) => {
    setFavorites((prevFavorites) => [...prevFavorites, recipe]);
  };

  const removeFavorite = (recipe: Recipe) => {
    setFavorites((prevFavorites) =>
      prevFavorites.filter((fav) => fav.id !== recipe.id)
    );
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
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { LoginButton } from './Components/LoginButton';
import Link from 'next/link';

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
  title: "Recipe App",
  description: "A modern recipe management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <UserProvider>
          <FavoritesProvider>
            <header className="bg-primary text-white py-3">
              <div className="container d-flex justify-content-between align-items-center">
                <h1 className="h4 m-0">
                  <Link href="/" className="text-white text-decoration-none">Recipes</Link>
                </h1>
                <LoginButton />
              </div>
            </header>
            <div className="container-fluid" style={{ maxWidth: "700px", margin: "0 auto" }}>
              {children}
            </div>
          </FavoritesProvider>
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

# app\recipe\[title]\[cookingTime]\page.tsx

```tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../../../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { FavouriteRecipeComponent } from '../../../Components/Favorites';
import { RecipeSkeleton } from './RecipeSkeleton';
import { FollowButton } from '../../../Components/FollowButton';


interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}


export default function RecipeDetails() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const {title, cookingTime } = useParams() as { title: string; cookingTime: string };
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useUser();
  const [favorites, setFavorites] = useLocalStorage<Recipe[]>(
    'favorites',
    []
  ) as [Recipe[], React.Dispatch<React.SetStateAction<Recipe[]>>];
  useEffect(() => {
    if (title && cookingTime) {
      const decodedTitle = decodeURIComponent(title);
      const normalizedCookingTime = normalizeCookingTime(cookingTime);

      const fav = favorites.find(
        (fav) =>
          fav.title === decodedTitle &&
          fav.cookingTime && fav.cookingTime == normalizedCookingTime && fav.instructions?.length > 0 && fav.ingredients?.length > 0
      );

      if (fav !== undefined) {
        setRecipe(fav);
        setLoading(false);
        console.log('Recipe found in favorites:', fav);
      } else {
        console.log('Recipe not found in favorites or not fully cached, fetching details...');
        
        fetchRecipeDetails(title, cookingTime, decodedTitle, normalizedCookingTime);
        
      }
    }
  }, [title, cookingTime, favorites]);

  const normalizeCookingTime = (time: string) => time?.replace(/\D/g, '');




  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?recipeId=${recipe?.id}`);
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };


  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipe) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id, content: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };


  useEffect(() => {
    if (recipe) {
      fetchComments();
    }
  }, [recipe]);


  const cacheRestOfRecipe = (recipe : Recipe) => {
    console.log("Checking if recipe is already in favorites" )



    if(!favorites.some((fav) =>  fav.instructions )  && favorites.some((fav) => fav.title == decodeURIComponent(title) && fav.cookingTime == cookingTime  ) ){
    if (recipe) {
        console.log("Caching rest of recipe")
     //add rest of elements to cache instead of appending new recipe
    setFavorites([...favorites.filter((fav) => fav.title !== decodeURIComponent(title) && fav.cookingTime !== cookingTime), { ...recipe }]);
    } 
} 
}

  const fetchRecipeDetails = async (title: string, cookingTime: string, decodedTitle: string, normalizedCookingTime: string) => {
    setLoading(true);
    try {
      // Fetch recipe details if not in favorites
      const response = await fetch('/api/getRecipeDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, cookingTime }),
      });
      const data = await response.json();


const fav = favorites.find(
  (fav) =>
    fav.title === decodedTitle &&
    fav.cookingTime && fav.cookingTime == normalizedCookingTime 
);
console.log("Old id", fav?.id)
data.recipe.id = fav?.id || data.recipe.id;
      setRecipe(data.recipe);
      cacheRestOfRecipe(data.recipe);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
    } finally {
      setLoading(false);
      
    }
  };

if (loading) return <RecipeSkeleton />;
  if (!recipe) return <div className="container mt-5">Recipe not found</div>;
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <img src={recipe.imageUrlLarge} alt="Recipe" className="img-fluid mb-4" style={{ width: '20rem', height: 'auto' }} />
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="mb-0">{recipe.title}</h1>
            <FavouriteRecipeComponent recipe={recipe} favorites={favorites} setFavorites={setFavorites} />
          </div>
          <p className="text-muted">{recipe.cookingTime} mins</p>
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
        {comments.map((comment) => (
          <div key={comment.id} className="mb-3">
            <strong>{comment.user.name}</strong>
            <p>{comment.content}</p>
            <small className="text-muted">{new Date(comment.createdAt).toLocaleString()}</small>
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
          <FollowButton userId={recipe.author.id} initialIsFollowing={false} />
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

# app\types\index.ts

```ts
export interface Recipe {
  author: any;
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  nutritionInfo?: string;
  cookingTime?: string;
  servingSize?: string;
  imageUrl?: string;
  imageUrlLarge?: string;
}


export interface FavouriteRecipeComponentProps {
  recipe: Recipe;
  favorites: Recipe[];
  setFavorites: React.Dispatch<React.SetStateAction<Recipe[]>>;
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
    "@prisma/client": "^5.21.0",
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
  id         String    @id 
  email              String     @unique
  name               String?
  recipes            Recipe[]
  favorites          Favorite[]
  following          Follow[]   @relation("UserFollowing")
  followers          Follow[]   @relation("UserFollowers")
  mealPlans          MealPlan[]
  subscriptionStatus String     @default("free")
  comments  Comment[]
  activities Activity[]
}

model Recipe {
  id           String     @id @default(cuid())
  title        String
  ingredients  String[]
  instructions String[]
  cookingTime  Int
  imageUrl     String?
  author       User       @relation(fields: [authorId], references: [id])
  authorId     String
  favorites    Favorite[]
  mealPlans    MealPlan[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  comments Comment[]
  activities Activity[]
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
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  recipe    Recipe   @relation(fields: [recipeId], references: [id])
  recipeId  String
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


# React Challenge

Welcome to the React Challenge project! This project is a recipe management application built with React and Next.js.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Installation

To get started with the project, clone the repository and install the dependencies:

\`\`\`sh
git clone https://github.com/olteanalexandru/Junior-Full-Stack-Tech-Challenge
cd react-challenge
npm install


## Usage

To start the development server, run the following command:

\`\`\`sh

npm run dev
\`\`\`

## Environment Variables

The project uses environment variables to configure the application. Create a `.env.local` file in the root of the project and add the following variables:

\`\`\`sh
OPENAI_API_KEY: Your OpenAI API key.
PEXELS_API_KEY: Your Pexels API key.
\`\`\`
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

