"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Recipe } from '../types';
import { RecipeCard } from '../Components/recipes/RecipeCard';
import { RecipeGridSkeleton } from '../Components/recipes/RecipeSkeleton';
import { Loader2 } from 'lucide-react';

function RecipesContent() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  useEffect(() => {
    if (query) {
      fetchRecipes(query);
    }
  }, [query]);

  const fetchRecipes = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/getRecipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
    setLoading(false);
  };

  const fetchOtherRecipes = async () => {
    if (!query) return;
    
    setFetchingMore(true);
    try {
      const response = await fetch('/api/suggestOtherRecipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, avoid: recipes }),
      });
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setFetchingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex flex-col gap-8">
          <div className="space-y-2">
            <h1 className="page-title">AI Generated Recipes</h1>
            <p className="text-gray-400">
              Searching for: <span className="text-cyber-primary">{query}</span>
            </p>
          </div>
          <RecipeGridSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="page-title">AI Generated Recipes</h1>
          <p className="text-gray-400">
            Searching for: <span className="text-cyber-primary">{query}</span>
          </p>
        </div>

        {/* Recipe Grid */}
        <div className="grid gap-6">
          {recipes?.map((recipe) => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe}
              isAIGenerated={!recipe.authorId} // Mark as AI generated if no author
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button 
            onClick={fetchOtherRecipes}
            disabled={fetchingMore}
            className="btn-cyber relative"
          >
            {fetchingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading more recipes...
              </>
            ) : (
              "Show me different recipes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Recipes() {
  return (
    <Suspense fallback={<RecipeGridSkeleton />}>
      <RecipesContent />
    </Suspense>
  );
}
