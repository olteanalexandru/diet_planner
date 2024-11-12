import { Recipe } from './recipe';

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

export interface PaginationState {
  page: number;
  hasMore: boolean;
  isLoading: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface RecipeFeed {
  recipes: Recipe[];
  hasMore: boolean;
  total: number;
}
