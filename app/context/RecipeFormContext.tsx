'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Recipe } from '../types';
import { recipeService } from '../services/recipeService';

interface RecipeFormContextType {
  loading: boolean;
  error: string | null;
  createRecipe: (data: Partial<Recipe>) => Promise<void>;
  updateRecipe: (id: string, data: Partial<Recipe>) => Promise<void>;
}

const RecipeFormContext = createContext<RecipeFormContextType | undefined>(undefined);

export function RecipeFormProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createRecipe = async (data: Partial<Recipe>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const recipe = await recipeService.createRecipe(data);
      
      // Redirect based on status
      if (recipe.status === 'draft') {
        router.push('/dashboard'); // Drafts are shown in dashboard
      } else {
        router.push(`/recipe/${encodeURIComponent(recipe.title)}/${recipe.cookingTime}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRecipe = async (id: string, data: Partial<Recipe>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const recipe = await recipeService.updateRecipe(id, data);
      
      // Redirect based on status
      if (recipe.status === 'draft') {
        router.push('/dashboard'); // Drafts are shown in dashboard
      } else {
        router.push(`/recipe/${encodeURIComponent(recipe.title)}/${recipe.cookingTime}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    error,
    createRecipe,
    updateRecipe
  };

  return (
    <RecipeFormContext.Provider value={value}>
      {children}
    </RecipeFormContext.Provider>
  );
}

export const useRecipeForm = () => {
  const context = useContext(RecipeFormContext);
  if (context === undefined) {
    throw new Error('useRecipeForm must be used within a RecipeFormProvider');
  }
  return context;
};
