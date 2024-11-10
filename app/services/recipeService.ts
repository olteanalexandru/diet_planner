import { Recipe } from '../types';

type SortOption = 'trending' | 'latest';

interface FeedResponse {
  recipes: Recipe[];
  hasMore: boolean;
}

interface LikeResponse {
  isLiked: boolean;
  likes: number;
}

interface TrendingTag {
  tag: string;
  count: number;
}

interface RecipeResponse {
  recipes: Recipe[];
}

class RecipeService {
  async getFeedRecipes(
    category: string, 
    sort: SortOption, 
    page: number, 
    tagFilter: string | null
  ): Promise<FeedResponse> {
    const response = await fetch('/api/recipes/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, sort, page, tag: tagFilter }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recipes');
    }

    return await response.json();
  }

  async getUserRecipes(userId: string): Promise<RecipeResponse> {
    const response = await fetch(`/api/recipes?userId=${encodeURIComponent(userId)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user recipes');
    }

    return await response.json();
  }

  async getTrendingTags(): Promise<TrendingTag[]> {
    const response = await fetch('/api/recipes/trending-tags');
    if (!response.ok) {
      throw new Error('Failed to fetch trending tags');
    }
    const data = await response.json();
    return data.tags;
  }

  async createRecipe(data: Partial<Recipe>): Promise<Recipe> {
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create recipe');
    }

    const { recipe } = await response.json();
    return recipe;
  }

  async updateRecipe(id: string, data: Partial<Recipe>): Promise<Recipe> {
    const response = await fetch(`/api/recipes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update recipe');
    }

    const { recipe } = await response.json();
    return recipe;
  }

  async likeRecipe(recipeId: string): Promise<LikeResponse> {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/like`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        if (response.status === 400) {
          // If already liked, force refresh the like status
          return this.getLikeStatus(recipeId);
        }
        throw new Error('Failed to like recipe');
      }
      
      const data = await response.json();
      return {
        isLiked: true,
        likes: data.likes
      };
    } catch (error) {
      throw new Error('Failed to like recipe');
    }
  }

  async unlikeRecipe(recipeId: string): Promise<LikeResponse> {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/like`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // If like not found, force refresh the like status
          return this.getLikeStatus(recipeId);
        }
        throw new Error('Failed to unlike recipe');
      }
      
      const data = await response.json();
      return {
        isLiked: false,
        likes: data.likes
      };
    } catch (error) {
      throw new Error('Failed to unlike recipe');
    }
  }

  private async getLikeStatus(recipeId: string): Promise<LikeResponse> {
    const response = await fetch(`/api/recipes/${recipeId}/like/status`);
    if (!response.ok) {
      throw new Error('Failed to get like status');
    }
    const { isLiked, likes } = await response.json();
    return { isLiked, likes };
  }
}

export const recipeService = new RecipeService();
