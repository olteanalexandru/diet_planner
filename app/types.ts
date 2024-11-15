import { RecipeCount, Recipe } from './types/recipe';
import { Comment, CommentResponse } from './types/comment';
import { User } from './types/user';
import { DashboardContextType } from './types/context';
import { ActivityGroup, ActivityFilter, SocialContextType, SocialFeedResponse } from './types/social';
import  {ApiResponse , RecipesResponse , LikeResponse , PaginationState , LoadingState , RecipeFeed,ApiError}  from './types/api';
import { SortOption } from './types/recipe-feed';
interface FavouriteRecipeComponentProps {
  recipe: Recipe;
  favorites: Recipe[];
  setFavorites: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
  onToggle?: () => void;
  onFollowToggle?: (isFollowing: boolean) => void;
}

export type {
  FollowButtonProps,
  RecipeCount,
  Recipe,
  User,
  FavouriteRecipeComponentProps,
  Comment,
  CommentResponse,
  DashboardContextType,
  ActivityGroup,
  ActivityFilter,
  SocialContextType,
  SocialFeedResponse,
  ApiResponse,
  RecipesResponse,
  LikeResponse,
  PaginationState,
  LoadingState,
  RecipeFeed,
  ApiError,
  SortOption,

};
