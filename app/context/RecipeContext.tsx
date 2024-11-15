'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Recipe, RecipeCount } from '../types';
import { recipeService } from '../services/recipeService';
import { SortOption } from '../types';
interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  fetchRecipes: (
    query?: string,
    includeDrafts?: boolean,
    page?: number,
    sort?: SortOption
  ) => Promise<void>;
  fetchRecipeDetails: (title: string, cookingTime: number) => Promise<Recipe | null>;
  createRecipe: (recipeData: Partial<Recipe>) => Promise<Recipe | null>;
  updateRecipe: (id: string, recipeData: Partial<Recipe>) => Promise<Recipe | null>;
  deleteRecipe: (id: string) => Promise<boolean>;
  likeRecipe: (id: string) => Promise<void>;
  unlikeRecipe: (id: string) => Promise<void>;
  updateDraftStatus: (id: string, isDraft: boolean) => Promise<Recipe | null>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async (
    query?: string,
    includeDrafts = false,
    page = 1,
    sort: SortOption = 'latest'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await recipeService.getFeedRecipes(
        'all', // category
        sort as SortOption, // sort order
        page, // page number
        query ?? null // search query/tag filter
      );
      setRecipes(response.recipes);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch recipes');
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipeDetails = useCallback(async (title: string, cookingTime: number): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await recipeService.getFeedRecipes(
        'all',
        'latest' as SortOption,
        1,
        title
      );
      if (response.recipes.length > 0) {
        return response.recipes.find(recipe => recipe.title === title && recipe.cookingTime === cookingTime) || null;
      }
      return null;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch recipe details');
      console.error('Error fetching recipe details:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecipe = useCallback(async (recipeData: Partial<Recipe>): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const newRecipe = await recipeService.createRecipe(recipeData);
      setRecipes(prev => [newRecipe, ...prev]);
      return newRecipe;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create recipe');
      console.error('Error creating recipe:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRecipe = useCallback(async (id: string, recipeData: Partial<Recipe>): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedRecipe = await recipeService.updateRecipe(id, recipeData);
      setRecipes(prev => prev.map(recipe => 
        recipe.id === id ? updatedRecipe : recipe
      ));
      return updatedRecipe;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update recipe');
      console.error('Error updating recipe:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDraftStatus = useCallback(async (id: string, isDraft: boolean): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedRecipe = await recipeService.updateRecipe(id, {
        status: isDraft ? 'draft' : 'published',
        isPublished: !isDraft
      });
      setRecipes(prev => prev.map(recipe => 
        recipe.id === id ? updatedRecipe : recipe
      ));
      return updatedRecipe;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update draft status');
      console.error('Error updating draft status:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecipe = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Since deleteRecipe is not implemented in the service,
      // we'll throw an error for now
      throw new Error('Delete recipe functionality not implemented');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete recipe');
      console.error('Error deleting recipe:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const likeRecipe = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      const response = await recipeService.likeRecipe(id);
      setRecipes(prev => prev.map(recipe => {
        if (recipe.id === id) {
          const updatedCount: RecipeCount = {
            ...recipe._count,
            likes: response.likes
          };
          return {
            ...recipe,
            isLiked: response.isLiked,
            _count: updatedCount
          };
        }
        return recipe;
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to like recipe');
      console.error('Error liking recipe:', error);
    }
  }, []);

  const unlikeRecipe = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      const response = await recipeService.unlikeRecipe(id);
      setRecipes(prev => prev.map(recipe => {
        if (recipe.id === id) {
          const updatedCount: RecipeCount = {
            ...recipe._count,
            likes: response.likes
          };
          return {
            ...recipe,
            isLiked: response.isLiked,
            _count: updatedCount
          };
        }
        return recipe;
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unlike recipe');
      console.error('Error unliking recipe:', error);
    }
  }, []);

  const value: RecipeContextType = {
    recipes,
    loading,
    error,
    fetchRecipes,
    fetchRecipeDetails,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    likeRecipe,
    unlikeRecipe,
    updateDraftStatus
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};
