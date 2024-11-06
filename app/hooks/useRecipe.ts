import { useState, useCallback } from 'react';
import { Recipe, ApiResponse, RecipeFormData } from '../types';
import { recipeService } from '../services/recipeService';

export const useRecipe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRecipe = useCallback(async (recipeData: RecipeFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await recipeService.createRecipe(recipeData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRecipe = useCallback(async (id: string, recipeData: Partial<Recipe>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await recipeService.updateRecipe(id, recipeData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecipe = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await recipeService.deleteRecipe(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleLike = useCallback(async (id: string, isLiked: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = isLiked 
        ? await recipeService.unlikeRecipe(id)
        : await recipeService.likeRecipe(id);
      
      if (response.error) {
        throw new Error(response.error);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle like');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    toggleLike,
  };
};
