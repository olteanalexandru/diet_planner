import { Recipe, ApiResponse, RecipesResponse, SearchParams, FilterOptions } from '../types/';

const BASE_URL = '/api/recipes';

export const recipeService = {
  async getRecipes(params: SearchParams = {}, filters: FilterOptions = {}): Promise<ApiResponse<RecipesResponse>> {
    try {
      const searchParams = new URLSearchParams();
      
      // Add search params
      if (params.query) searchParams.append('query', params.query);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.order) searchParams.append('order', params.order);

      // Add filters
      if (filters.cookingTime) {
        searchParams.append('minTime', filters.cookingTime.min.toString());
        searchParams.append('maxTime', filters.cookingTime.max.toString());
      }
      if (filters.ingredients?.length) {
        searchParams.append('ingredients', filters.ingredients.join(','));
      }
      if (filters.author) {
        searchParams.append('author', filters.author);
      }

      const response = await fetch(`${BASE_URL}?${searchParams}`);
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to fetch recipes', status: 500 };
    }
  },

  async createRecipe(recipe: Partial<Recipe>): Promise<ApiResponse<Recipe>> {
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

  async likeRecipe(id: string): Promise<ApiResponse<{ likeCount: number }>> {
    try {
      const response = await fetch(`${BASE_URL}/${id}/like`, {
        method: 'POST',
      });
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to like recipe', status: 500 };
    }
  },

  async unlikeRecipe(id: string): Promise<ApiResponse<{ likeCount: number }>> {
    try {
      const response = await fetch(`${BASE_URL}/${id}/like`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to unlike recipe', status: 500 };
    }
  }
};
