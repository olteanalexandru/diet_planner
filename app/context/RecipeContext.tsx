'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Recipe } from '@/app/types';

interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  filters: {
    category?: string;
    difficulty?: string;
    cuisine?: string;
    dietaryPreferences?: string[];
    tags?: string[];
  };
  setFilters: (filters: any) => void;
  fetchRecipes: (options?: { 
    category?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchRecipeById: (id: string) => Promise<Recipe | null>;
  createRecipe: (data: Partial<Recipe>) => Promise<Recipe>;
  updateRecipe: (id: string, data: Partial<Recipe>) => Promise<Recipe>;
  deleteRecipe: (id: string) => Promise<void>;
  likeRecipe: (id: string) => Promise<void>;
  unlikeRecipe: (id: string) => Promise<void>;
  clearError: () => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({});

  const clearError = () => setError(null);

  const fetchRecipes = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        ...options,
        ...filters,
      });

      const response = await fetch(`/api/recipes?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch recipes');

      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch recipes');
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchRecipeById = useCallback(async (id: string): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recipes/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }
      const data = await response.json();
      return data.recipe;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch recipe');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecipe = useCallback(async (data: Partial<Recipe>): Promise<Recipe> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create recipe');
      }

      const newRecipe = await response.json();
      setRecipes(prev => [newRecipe, ...prev]);
      return newRecipe;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create recipe');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRecipe = useCallback(async (id: string, data: Partial<Recipe>): Promise<Recipe> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      const updatedRecipe = await response.json();
      setRecipes(prev => 
        prev.map(recipe => recipe.id === id ? updatedRecipe : recipe)
      );
      return updatedRecipe;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update recipe');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecipe = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      setRecipes(prev => prev.filter(recipe => recipe.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete recipe');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const likeRecipe = useCallback(async (recipeId: string): Promise<void> => {
    setError(null);
    try {
      const response = await fetch('/api/recipes/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      });

      if (!response.ok) throw new Error('Failed to like recipe');

      const { likeCount } = await response.json();

      setRecipes(prev =>
        prev.map(recipe =>
          recipe.id === recipeId
            ? { 
                ...recipe, 
                isLiked: true,
                _count: { 
                  ...recipe._count,
                  likes: likeCount 
                }
              }
            : recipe
        )
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to like recipe');
      console.error('Error liking recipe:', error);
      throw error;
    }
  }, []);

  const unlikeRecipe = useCallback(async (recipeId: string): Promise<void> => {
    setError(null);
    try {
      const response = await fetch('/api/recipes/likes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      });

      if (!response.ok) throw new Error('Failed to unlike recipe');

      const { likeCount } = await response.json();

      setRecipes(prev =>
        prev.map(recipe =>
          recipe.id === recipeId
            ? { 
                ...recipe, 
                isLiked: false,
                _count: { 
                  ...recipe._count,
                  likes: likeCount 
                }
              }
            : recipe
        )
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unlike recipe');
      console.error('Error unliking recipe:', error);
      throw error;
    }
  }, []);

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        loading,
        error,
        filters,
        setFilters,
        fetchRecipes,
        fetchRecipeById,
        createRecipe,
        updateRecipe,
        deleteRecipe,
        likeRecipe,
        unlikeRecipe,
        clearError,
      }}
    >
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