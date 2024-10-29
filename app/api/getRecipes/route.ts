import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';
import { Recipe } from './../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const keepNumbersOnly = (time: string): number => {
  return parseInt(time.replace(/\D/g, ''), 10) || 30; // Default to 30 minutes if parsing fails
};

const generateUniqueId = (recipe: Recipe, imageUrl: string): string => {
  const timestamp = Date.now();
  return `${timestamp}-${recipe.title.toLowerCase().replace(/\s+/g, '-')}-${imageUrl.slice(-8)}`;
};

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    const normalisedQuery = query.replace(/[^a-zA-Z0-9\s]/g, '');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an API that only returns raw JSON data. You never respond with additional text, explanations, or descriptions." },
        { role: "user", content: `Suggest 5 recipes for: ${normalisedQuery}. Only return a JSON array of objects, each with 'id', 'title', and 'cookingTime' properties. 'cookingTime' should be in exact minutes as a number. Do not include any other text or explanations, only the JSON.` }
      ],
    });

    let recipes: Recipe[] = [];

    try {
      const parsedContent = completion.choices[0].message?.content || '[]';
      recipes = JSON.parse(parsedContent);

      // Validate and fix recipe data
      recipes = recipes.map(recipe => ({
        ...recipe,
        cookingTime: typeof recipe.cookingTime === 'number' ? recipe.cookingTime : keepNumbersOnly(String(recipe.cookingTime)),
        createdAt: new Date().toISOString(), // Add proper timestamp
        updatedAt: new Date().toISOString(), // Add proper timestamp
      }));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON format from OpenAI');
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
          imageUrl,
          imageUrlLarge,
          _count: {
            likes: 0,
            comments: 0
          }
        };
      } catch (error) {
        console.error(`Error fetching image for ${recipe.title}:`, error);
        return { 
          ...recipe,
          id: generateUniqueId(recipe, ''),
          imageUrl: '',
          imageUrlLarge: '',
          _count: {
            likes: 0,
            comments: 0
          }
        };
      }
    }));

    return NextResponse.json({ recipes: recipesWithImages });
  } catch (error) {
    console.error('Error in getRecipes:', error);
    return NextResponse.json({ error: 'Error fetching recipes' }, { status: 500 });
  }
}



