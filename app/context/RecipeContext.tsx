'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Recipe, RecipeContextType, SearchParams,  RecipeCount } from '../types/';
import { recipeService } from '../services/recipeService';

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const searchParams: SearchParams = {
        query,
        page: 1,
        limit: 20,
        sortBy: 'date',
        order: 'desc'
      };

      const response = await recipeService.getRecipes(searchParams);
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        setRecipes(response.data.recipes);
      }
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
      const searchParams: SearchParams = {
        query: title,
      };
      const response = await recipeService.getRecipes(searchParams);
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data && response.data.recipes.length > 0) {
        return response.data.recipes.find((recipe: Recipe) => recipe.title === title && recipe.cookingTime === cookingTime) || null;
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
      const response = await recipeService.createRecipe(recipeData);
      if (response.error) {
        throw new Error(response.error);
      }
  if (response.data) {
    const newRecipe = response.data || {} as Recipe;
    setRecipes(prev => [newRecipe, ...prev]);
    return newRecipe;
  }
      return null;
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
      const response = await recipeService.updateRecipe(id, recipeData);
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        const updatedRecipe = response.data || {} as Recipe;
        setRecipes(prev => prev.map(recipe => 
          recipe.id === id ? updatedRecipe : recipe
        ));
        return updatedRecipe;
      }
      return null;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update recipe');
      console.error('Error updating recipe:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecipe = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await recipeService.deleteRecipe(id);
      if (response.error) {
        throw new Error(response.error);
      }
      setRecipes(prev => prev.filter(recipe => recipe.id !== id));
      return true;
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
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        setRecipes(prev => prev.map(recipe => {
          if (recipe.id === id) {
            const updatedCount: RecipeCount = {
              ...recipe._count,
              likes: response.data ? response.data.likeCount : recipe._count.likes
            };
            return {
              ...recipe,
              isLiked: true,
              _count: updatedCount
            };
          }
          return recipe;
        }));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to like recipe');
      console.error('Error liking recipe:', error);
    }
  }, []);

  const unlikeRecipe = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      const response = await recipeService.unlikeRecipe(id);
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        setRecipes(prev => prev.map(recipe => {
          if (recipe.id === id) {
            const updatedCount: RecipeCount = {
              ...recipe._count,
              likes: response.data ? response.data.likeCount : recipe._count.likes
            };
            return {
              ...recipe,
              isLiked: false,
              _count: updatedCount
            };
          }
          return recipe;
        }));
      }
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
    unlikeRecipe
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
