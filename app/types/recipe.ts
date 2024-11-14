import { User } from './user';
import { Comment } from './comment';

export interface RecipeCount {
  likes: number;
  comments: number;
  favorites: number;
}

export interface Recipe {
  [x: string]: any;
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
  comments?: Comment[];
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'popularity' | 'title';
  order?: 'asc' | 'desc';
}

export interface RecipeFilterOptions {
  cookingTime?: {
    min: number;
    max: number;
  };
  ingredients?: string[];
  author?: string;
}
