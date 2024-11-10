import { ReactNode } from 'react';
import { UserProfile } from '@auth0/nextjs-auth0/client';

// User Types
interface Auth0User extends UserProfile {
  sub: string;
  email?: string;
  name?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  location?: string;
  website?: string;
  specialties: string[];
  dietaryPreferences: string[];
  avatar?: string;
  _count?: {
    recipes: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

// Recipe Types
export interface RecipeCount {
  likes: number;
  comments: number;
  favorites: number;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  cuisine?: string;
  tags: string[];
  dietaryInfo: Record<string, boolean>;
  prepTime?: number;
  totalTime?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  rating?: number;
  ratingCount: number;
  imageUrl?: string | null;
  imageUrlLarge?: string | null;
  viewCount: number;
  isPublished: boolean;
  authorId: string;
  author?: User;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived' | 'ai_generated';
  _count: RecipeCount;
  isLiked?: boolean;
  isOwner?: boolean;
}

// Context Types
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

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface RecipesResponse {
  recipes: Recipe[];
  hasMore?: boolean;
}

export interface LikeResponse {
  likeCount: number;
}

// Search and Filter Types
export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'popularity' | 'title';
  order?: 'asc' | 'desc';
}

export interface FilterOptions {
  cookingTime?: {
    min: number;
    max: number;
  };
  ingredients?: string[];
  author?: string;
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
  likes: number;
  isLiked: boolean;
}

// Component Props Types
export interface RecipeCardProps {
  recipe: Recipe;
  onDelete?: (recipeId: string) => void;
  onEdit?: (recipeId: string, updatedRecipe: Recipe) => void;
}

export interface CommentProps {
  comment: Comment;
  onDelete: (commentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  onUnlike: (commentId: string) => Promise<void>;
}

// State Types
export interface PaginationState {
  page: number;
  hasMore: boolean;
  isLoading: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Feed Types
export interface RecipeFeed {
  recipes: Recipe[];
  hasMore: boolean;
  total: number;
}

export interface RecipeFeedFilters {
  category: string;
  sort: string;
  page: number;
}

export interface CommentResponse {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}
