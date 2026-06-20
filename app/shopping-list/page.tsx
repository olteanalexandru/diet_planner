'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { PremiumUpsell } from '../Components/PremiumUpsell';

interface ShoppingListItem {
  ingredient: string;
  recipes: string[];
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [recipeCount, setRecipeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/mealPlanning/shopping-list')
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 403) {
          setLocked(true);
          return;
        }
        if (!res.ok) throw new Error(data.error || 'Failed to load shopping list');
        setItems(data.items || []);
        setRecipeCount(data.recipeCount || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <ShoppingCart size={24} />
        Shopping List
      </h1>

      {loading && <p className="text-space-400">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {locked && (
        <PremiumUpsell
          title="Shopping list builder"
          message="Upgrade to Premium to automatically build a shopping list from your meal plan."
        />
      )}

      {!loading && !locked && !error && (
        <>
          <p className="text-space-400 mb-4">
            Built from {recipeCount} planned meal{recipeCount === 1 ? '' : 's'}.
          </p>
          {items.length === 0 ? (
            <p className="text-space-400">Add recipes to your meal plan to generate a shopping list.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.ingredient}
                  className="p-3 rounded-lg border border-space-700 bg-space-800/50"
                >
                  <span className="text-space-200 capitalize">{item.ingredient}</span>
                  <span className="block text-xs text-space-500 mt-1">
                    For: {item.recipes.join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
