'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe } from '../types';

interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  fetchRecipes: (query: string) => Promise<void>;
  fetchRecipeDetails: (title: string, cookingTime: string) => Promise<Recipe | null>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/getRecipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeDetails = async (title: string, cookingTime: string): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/getRecipeDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, cookingTime }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }
      const data = await response.json();
      return data.recipe;
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setError('Failed to load recipe details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecipeContext.Provider value={{ recipes, loading, error, fetchRecipes, fetchRecipeDetails }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};