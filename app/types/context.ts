import { Recipe } from './recipe';
import { RecipeFeedFilters } from './recipe-feed';

export interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  fetchRecipes: (query: string) => Promise<void>;
  fetchRecipeDetails: (title: string, cookingTime: number) => Promise<Recipe | null>;
  createRecipe: (recipeData: Partial<Recipe>) => Promise<Recipe | null>;
  updateRecipe: (id: string, recipeData: Partial<Recipe>) => Promise<Recipe | null>;
  deleteRecipe: (id: string) => Promise<boolean>;
  likeRecipe: (id: string) => Promise<void>;
  unlikeRecipe: (id: string) => Promise<void>;
}

export interface RecipeFeedContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  filters: RecipeFeedFilters;
  fetchRecipes: (page?: number) => Promise<void>;
  setFilters: (filters: Partial<RecipeFeedFilters>) => void;
}

export interface DashboardContextType {
  customRecipes: Recipe[];
  favorites: Recipe[];
  followersCount: number;
  followingCount: number;
  error: string | null;
  refreshCustomRecipes: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
  refreshFollowCounts: () => Promise<void>;
}
