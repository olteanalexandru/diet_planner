
import { User as PrismaUser, Recipe as PrismaRecipe } from '@prisma/client';
import { ReactNode } from 'react';

// Core Types
export interface User extends PrismaUser {
  _count?: {
    recipes: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
  bio?: string;
}

export interface Recipe extends PrismaRecipe {
  author?: User;
  comments?: Comment[];
  isOwner?: boolean;
  _count?: {
    likes: number;
    comments: number;
  };
}

// Context Types
export interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  fetchRecipes: (query: string) => Promise<void>;
  fetchRecipeDetails: (title: string, cookingTime: string) => Promise<Recipe | null>;
}

export interface FavoritesContextType {
  favorites: Recipe[];
  addFavorite: (recipe: Recipe) => Promise<void>;
  removeFavorite: (recipe: Recipe) => Promise<void>;
  isFavorite: (recipe: Recipe) => boolean;
}

export interface CommentContextType {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  fetchComments: (recipeId: string) => Promise<void>;
  addComment: (recipeId: string, content: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
}

// Component Props Types
export interface RecipeCardProps {
  recipe: Recipe;
}

export interface CommentProps {
  comment: Comment;
  onDelete: (commentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  onUnlike: (commentId: string) => Promise<void>;
}

export interface ProfileHeaderProps {
  profile: User;
  recipeCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  onFollowToggle: () => void;
}

export interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
  onToggle?: (isFollowing: boolean) => void;
}

export interface UserRecipesProps {
  recipes: Recipe[];
}

export interface UserStatsProps {
  icon: ReactNode;
  label: string;
  value: number;
}

export interface UserFollowStatsProps {
  followersCount: number;
  followingCount: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface RecipeResponse {
  recipe: Recipe;
}

export interface RecipesResponse {
  recipes: Recipe[];
  hasMore?: boolean;
}

export interface CommentResponse {
  comment: Comment;
}

export interface CommentsResponse {
  comments: Comment[];
  hasMore?: boolean;
}

export interface UserResponse {
  user: User;
}

export interface FavoriteResponse {
  favorite: {
    id: string;
    userId: string;
    recipeId: string;
    createdAt: string;
  };
}

export interface FollowResponse {
  isFollowing: boolean;
  followersCount?: number;
  followingCount?: number;
}

// Form Types
export interface RecipeFormData {
  title: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  imageUrl?: string;
}

export interface CommentFormData {
  content: string;
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

// Event Handler Types
export interface RecipeEventHandlers {
  onEdit?: (recipeId: string) => void;
  onDelete?: (recipeId: string) => void;
  onFavorite?: (recipe: Recipe) => void;
  onShare?: (recipe: Recipe) => void;
}

export interface CommentEventHandlers {
  onSubmit: (content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
}

// Additional Social Types
export interface UserProfileStats {
  recipesCount: number;
  followersCount: number;
  followingCount: number;
  joinedDate: string;
}

export interface NotificationTypes {
  type: 'like' | 'comment' | 'follow' | 'achievement';
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress?: number;
  requirements?: string[];
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

// Utility Types
export type RecipeId = string;
export type UserId = string;
export type CommentId = string;

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

