"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Recipe } from '../types';
import { RecipeCard } from '../Components/recipes/RecipeCard';
import { RecipeGridSkeleton } from '../Components/recipes/RecipeSkeleton';
import { PremiumUpsell } from '../Components/PremiumUpsell';
import { useSubscription } from '../context/SubscriptionContext';
import { useLanguage } from '../context/LanguageContext';
import { Loader2 } from 'lucide-react';

type FetchError = { type: 'unauthorized' | 'limit' | 'generic' } | null;

function RecipesContent() {
  const { t } = useLanguage();
  const { refresh: refreshSubscription } = useSubscription();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState<FetchError>(null);
  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  useEffect(() => {
    if (query) {
      fetchRecipes(query);
    }
  }, [query]);

  const errorFromResponse = (status: number): FetchError => {
    if (status === 401) return { type: 'unauthorized' };
    if (status === 403) return { type: 'limit' };
    return { type: 'generic' };
  };

  const fetchRecipes = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/getRecipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!response.ok) {
        setError(errorFromResponse(response.status));
        setRecipes([]);
        return;
      }
      const data = await response.json();
      setRecipes(data.recipes);
      refreshSubscription();
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError({ type: 'generic' });
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherRecipes = async () => {
    if (!query) return;

    setFetchingMore(true);
    setError(null);
    try {
      const response = await fetch('/api/suggestOtherRecipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, avoid: recipes }),
      });
      if (!response.ok) {
        setError(errorFromResponse(response.status));
        return;
      }
      const data = await response.json();
      setRecipes(data.recipes);
      refreshSubscription();
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError({ type: 'generic' });
    } finally {
      setFetchingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex flex-col gap-8">
          <div className="space-y-2">
            <h1 className="page-title">{t('recipes.title')}</h1>
            <p className="text-gray-400">
              {t('recipes.searchingFor')} <span className="text-cyber-primary">{query}</span>
            </p>
          </div>
          <RecipeGridSkeleton />
        </div>
      </div>
    );
  }

  const initialFetchFailed = error && recipes.length === 0;

  return (
    <div className="page-container">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="page-title">{t('recipes.title')}</h1>
          <p className="text-gray-400">
            {t('recipes.searchingFor')} <span className="text-cyber-primary">{query}</span>
          </p>
        </div>

        {initialFetchFailed ? (
          error?.type === 'unauthorized' ? (
            <div className="bg-space-800 border border-space-700 rounded-xl p-6 text-center">
              <p className="text-space-300 mb-4">{t('recipes.error.loginRequired')}</p>
              <a href="/api/auth/login" className="btn-cyber inline-block">
                {t('auth.login')}
              </a>
            </div>
          ) : error?.type === 'limit' ? (
            <PremiumUpsell title={t('recipes.error.limitTitle')} message={t('recipes.error.limitMessage')} />
          ) : (
            <p className="text-center text-red-400">{t('recipes.error.generic')}</p>
          )
        ) : (
          <>
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

            {error?.type === 'limit' && (
              <p className="text-center text-sm text-cyber-primary">{t('recipes.error.limitInline')}</p>
            )}
            {error?.type === 'generic' && (
              <p className="text-center text-red-400">{t('recipes.error.generic')}</p>
            )}

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
                    {t('recipes.loadingMore')}
                  </>
                ) : (
                  t('recipes.showDifferent')
                )}
              </button>
            </div>
          </>
        )}
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
