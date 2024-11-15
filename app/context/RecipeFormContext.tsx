'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Recipe } from '../types/recipe';
import { recipeService } from '../services/recipeService';

interface RecipeFormContextType {
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  fetchRecipe: (recipeId: string) => Promise<void>;
  saveRecipe: (data: Partial<Recipe>) => Promise<void>;
  updateRecipe: (recipeId: string, data: Partial<Recipe>) => Promise<void>;
  createRecipe: (data: Partial<Recipe>) => Promise<void>;
  clearError: () => void;
}

const RecipeFormContext = createContext<RecipeFormContextType | undefined>(undefined);

export function RecipeFormProvider({ children }: { children: React.ReactNode }) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchRecipe = async (recipeId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) throw new Error('Failed to fetch recipe');
      
      const data = await response.json();
      setRecipe(data.recipe);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setError('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async (data: Partial<Recipe>) => {
    try {
      setSaving(true);
      setError(null);
      const savedRecipe = await recipeService.createRecipe(data);
      
      // Redirect based on status
      if (data.status === 'draft') {
        router.push('/dashboard');
      } else {
        router.push(`/recipe/${encodeURIComponent(savedRecipe.title)}/${savedRecipe.cookingTime}`);
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      setError('Failed to save recipe');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateRecipe = async (recipeId: string, data: Partial<Recipe>) => {
    try {
      setSaving(true);
      setError(null);
      const updatedRecipe = await recipeService.updateRecipe(recipeId, data);
      
      // Redirect based on status
      if (data.status === 'draft') {
        router.push('/dashboard');
      } else {
        router.push(`/recipe/${encodeURIComponent(updatedRecipe.title)}/${updatedRecipe.cookingTime}`);
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
      setError('Failed to update recipe');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const createRecipe = async (data: Partial<Recipe>) => {
    try {
      setSaving(true);
      setError(null);
      const savedRecipe = await recipeService.createRecipe(data);
      
      // Redirect based on status
      if (data.status === 'draft') {
        router.push('/dashboard');
      } else {
        router.push(`/recipe/${encodeURIComponent(savedRecipe.title)}/${savedRecipe.cookingTime}`);
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      setError('Failed to save recipe');
      throw error;
    } finally {
      setSaving(false);
    }
  }


  const clearError = () => setError(null);

  const value = {
    recipe,
    loading,
    error,
    saving,
    fetchRecipe,
    saveRecipe,
    updateRecipe,
    createRecipe,
    clearError,
  };

  return (
    <RecipeFormContext.Provider value={value}>
      {children}
    </RecipeFormContext.Provider>
  );
}

export function useRecipeForm() {
  const context = useContext(RecipeFormContext);
  if (context === undefined) {
    throw new Error('useRecipeForm must be used within a RecipeFormProvider');
  }
  return context;
}
