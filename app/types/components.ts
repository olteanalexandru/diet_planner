import { Recipe } from './recipe';
import { Comment } from './comment';

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
