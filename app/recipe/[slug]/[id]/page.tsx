'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Recipe } from '@/app/types';
import { RecipeDetail } from '@/app/Components/recipes/RecipeDetail';
import { Loader2 } from 'lucide-react';

export default function RecipePage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/recipes/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch recipe');
        }
        
        const data = await response.json();
        setRecipe(data.recipe);
      } catch (error) {
        console.error('Error fetching recipe:', error);
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipe();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center min-h-[60vh] flex-col gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-cyber-outline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex-center min-h-[60vh]">
        <p className="text-gray-400">Recipe not found</p>
      </div>
    );
  }

  return <RecipeDetail recipe={recipe} />;
}