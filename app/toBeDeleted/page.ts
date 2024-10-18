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