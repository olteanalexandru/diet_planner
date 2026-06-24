'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Recipe } from '../types/recipe';
import { RecipeCard } from './recipes/RecipeCard';
import { PremiumUpsell } from './PremiumUpsell';

interface Recommendation {
  recipe: Recipe;
  reason: string;
}

export const AiRecommendations: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalized, setPersonalized] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    fetch('/api/ai/recommendations')
      .then(async (res) => {
        if (res.status === 403) {
          setLocked(true);
          return null;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load recommendations');
        return data;
      })
      .then((data) => {
        if (!data) return;
        setRecommendations(data.recommendations || []);
        setPersonalized(!!data.personalized);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load recommendations'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-space-900/50 rounded-xl p-6 mb-8 flex justify-center">
        <Loader2 className="animate-spin text-cyber-primary" size={24} />
      </section>
    );
  }

  if (locked) {
    return (
      <section className="mb-8">
        <PremiumUpsell
          title="AI Recipe Recommendations"
          message="Upgrade to Premium to get personalized recipe picks based on what you've liked and favorited."
        />
      </section>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="bg-space-900/50 rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-cyber-primary flex items-center gap-2">
        <Sparkles size={20} />
        {personalized ? 'Recommended For You' : 'Trending Recipes'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map(({ recipe, reason }) => (
          <div key={recipe.id}>
            <RecipeCard recipe={recipe} />
            <p className="text-sm text-space-400 mt-2 px-1">{reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
