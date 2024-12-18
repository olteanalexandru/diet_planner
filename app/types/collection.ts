import { Recipe } from './recipe';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  category: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    recipes: number;
  };
}

export interface CollectionRecipe {
  id: string;
  collectionId: string;
  recipeId: string;
  addedAt: Date;
  recipe?: Recipe;
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  coverImage?: string;
  isPublic?: boolean;
  category?: string;
}

export interface UpdateCollectionInput extends Partial<CreateCollectionInput> {
  id: string;
}

export interface AddRecipeToCollectionInput {
  collectionId: string;
  recipeId: string;
}

export interface RemoveRecipeFromCollectionInput {
  collectionId: string;
  recipeId: string;
}
