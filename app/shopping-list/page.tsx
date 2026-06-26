'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { PremiumUpsell } from '../Components/PremiumUpsell';
import { useLanguage } from '../context/LanguageContext';

interface ShoppingListItem {
  ingredient: string;
  recipes: string[];
}

export default function ShoppingListPage() {
  const { t } = useLanguage();
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
        if (!res.ok) throw new Error(data.error || t('shoppingList.error'));
        setItems(data.items || []);
        setRecipeCount(data.recipeCount || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-space-50 mb-6 flex items-center gap-2">
        <ShoppingCart size={24} />
        {t('shoppingList.title')}
      </h1>

      {loading && <p className="text-space-400">{t('shoppingList.loading')}</p>}
      {error && <p className="text-red-400">{error}</p>}

      {locked && (
        <PremiumUpsell
          title={t('shoppingList.premiumTitle')}
          message={t('shoppingList.premiumMessage')}
        />
      )}

      {!loading && !locked && !error && (
        <>
          <p className="text-space-400 mb-4">
            {t(recipeCount === 1 ? 'shoppingList.builtFrom.one' : 'shoppingList.builtFrom.other', { count: recipeCount })}
          </p>
          {items.length === 0 ? (
            <p className="text-space-400">{t('shoppingList.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.ingredient}
                  className="p-3 rounded-lg border border-space-700 bg-space-800/50"
                >
                  <span className="text-space-200 capitalize">{item.ingredient}</span>
                  <span className="block text-xs text-space-500 mt-1">
                    {t('shoppingList.for', { recipes: item.recipes.join(', ') })}
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
