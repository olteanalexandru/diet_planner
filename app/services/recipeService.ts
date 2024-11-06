import { Recipe, RecipeFormData, ApiResponse, RecipesResponse } from '../types';

const BASE_URL = '/api/recipes';

export const recipeService = {
  async getRecipes(): Promise<ApiResponse<RecipesResponse>> {
    try {
      const response = await fetch(BASE_URL);
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to fetch recipes', status: 500 };
    }
  },

  async createRecipe(recipe: RecipeFormData): Promise<ApiResponse<Recipe>> {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      });
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to create recipe', status: 500 };
    }
  },

  async getRecipeById(id: string): Promise<ApiResponse<Recipe>> {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to fetch recipe', status: 500 };
    }
  },

  async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<ApiResponse<Recipe>> {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      });
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to update recipe', status: 500 };
    }
  },

  async deleteRecipe(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to delete recipe', status: 500 };
    }
  },

  async likeRecipe(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${BASE_URL}/${id}/like`, {
        method: 'POST',
      });
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to like recipe', status: 500 };
    }
  },

  async unlikeRecipe(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${BASE_URL}/${id}/like`, {
        method: 'DELETE',
      });
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to unlike recipe', status: 500 };
    }
  }
};
