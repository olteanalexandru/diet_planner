import { Recipe } from '../types/recipe';

export interface SearchFilters {
  title: string;
  tags: string[];
  diets: string[];
  ingredients: string[];
  page: number;
  limit: number;
}

interface SearchResponse {
  recipes: Recipe[];
  total: number;
}

interface TrendingTagsResponse {
  tags: { tag: string; count: number }[];
}

class SearchService {
  async searchRecipes(filters: SearchFilters): Promise<SearchResponse> {
    const response = await fetch('/api/recipes/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      throw new Error('Failed to search recipes');
    }

    return await response.json();
  }

  async getTrendingTags(): Promise<TrendingTagsResponse> {
    const response = await fetch('/api/recipes/trending-tags');
    
    if (!response.ok) {
      throw new Error('Failed to fetch trending tags');
    }

    return await response.json();
  }
}

export const searchService = new SearchService();
