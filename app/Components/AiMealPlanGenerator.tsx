'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Plus, Check, Clock } from 'lucide-react';
import { DIETARY_TAGS, CUISINE_TAGS } from '../utils/constants';
import { PremiumUpsell } from './PremiumUpsell';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKey } from '../translations';

interface PlannedMeal {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  title: string;
  description: string;
  estimatedCalories: number;
  estimatedCookingTime: number;
}

interface PlannedDay {
  day: number;
  meals: PlannedMeal[];
}

interface AiMealPlanGeneratorProps {
  onMealAdded?: () => void;
}

const MEAL_TYPE_KEYS: Record<PlannedMeal['mealType'], TranslationKey> = {
  breakfast: 'mealPlan.aiGenerator.mealType.breakfast',
  lunch: 'mealPlan.aiGenerator.mealType.lunch',
  dinner: 'mealPlan.aiGenerator.mealType.dinner',
};

function mealKey(day: number, mealType: string) {
  return `${day}-${mealType}`;
}

export const AiMealPlanGenerator: React.FC<AiMealPlanGeneratorProps> = ({ onMealAdded }) => {
  const { t } = useLanguage();
  const [days, setDays] = useState(3);
  const [calorieTarget, setCalorieTarget] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('');
  const [cuisinePreference, setCuisinePreference] = useState('');

  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlannedDay[] | null>(null);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setLocked(false);

    try {
      const response = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days, calorieTarget, dietaryPreference, cuisinePreference }),
      });

      if (response.status === 403) {
        setLocked(true);
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('mealPlan.aiGenerator.errorGenerate'));

      setPlan(data.plan);
      setAddedKeys(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mealPlan.aiGenerator.errorGenerate'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlan = async (day: number, meal: PlannedMeal) => {
    const key = mealKey(day, meal.mealType);
    setAddingKey(key);
    setError(null);

    try {
      const detailsResponse = await fetch('/api/getRecipeDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meal.title, cookingTime: meal.estimatedCookingTime || 30 }),
      });
      const detailsData = await detailsResponse.json();
      if (!detailsResponse.ok) throw new Error(detailsData.error || t('mealPlan.aiGenerator.errorRecipe'));

      let recipe = detailsData.recipe;

      if (recipe.id?.startsWith('temp-')) {
        const saveResponse = await fetch('/api/recipes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...recipe, status: 'draft', isPublished: false }),
        });
        const saveData = await saveResponse.json();
        if (!saveResponse.ok) throw new Error(saveData.error || t('mealPlan.aiGenerator.errorSave'));
        recipe = saveData.recipe;
      }

      const date = new Date();
      date.setDate(date.getDate() + (day - 1));

      const planResponse = await fetch('/api/mealPlanning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: date.toISOString(), recipeId: recipe.id }),
      });
      if (!planResponse.ok) throw new Error(t('mealPlan.aiGenerator.errorAdd'));

      setAddedKeys(prev => new Set(prev).add(key));
      onMealAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mealPlan.aiGenerator.errorAdd'));
    } finally {
      setAddingKey(null);
    }
  };

  if (locked) {
    return (
      <PremiumUpsell
        title={t('mealPlan.aiGenerator.title')}
        message={t('mealPlan.aiGenerator.upsellMessage')}
      />
    );
  }

  return (
    <div className="card-cyber p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-cyber-primary" />
        <h2 className="text-xl font-semibold">{t('mealPlan.aiGenerator.title')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t('mealPlan.aiGenerator.days')}</label>
          <input
            type="number"
            min={1}
            max={7}
            value={days}
            onChange={e => setDays(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
            className="input-cyber w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('mealPlan.aiGenerator.calorieTarget')}</label>
          <input
            type="number"
            min={0}
            value={calorieTarget}
            onChange={e => setCalorieTarget(e.target.value)}
            className="input-cyber w-full"
            placeholder={t('mealPlan.aiGenerator.optional')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('mealPlan.aiGenerator.diet')}</label>
          <select
            value={dietaryPreference}
            onChange={e => setDietaryPreference(e.target.value)}
            className="input-cyber w-full"
          >
            <option value="">{t('mealPlan.aiGenerator.any')}</option>
            {DIETARY_TAGS.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('mealPlan.aiGenerator.cuisine')}</label>
          <select
            value={cuisinePreference}
            onChange={e => setCuisinePreference(e.target.value)}
            className="input-cyber w-full"
          >
            <option value="">{t('mealPlan.aiGenerator.any')}</option>
            {CUISINE_TAGS.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="btn-cyber flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {t('mealPlan.aiGenerator.generating')}
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {t('mealPlan.aiGenerator.generate')}
          </>
        )}
      </button>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      {plan && plan.length > 0 && (
        <div className="mt-6 space-y-6">
          {plan.map(planDay => (
            <div key={planDay.day}>
              <h3 className="text-lg font-medium text-cyber-primary mb-3">{t('mealPlan.aiGenerator.day', { day: planDay.day })}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {planDay.meals.map(meal => {
                  const key = mealKey(planDay.day, meal.mealType);
                  const isAdding = addingKey === key;
                  const isAdded = addedKeys.has(key);
                  return (
                    <div key={key} className="border border-space-700 rounded-lg p-4">
                      <span className="text-xs uppercase text-space-400">{t(MEAL_TYPE_KEYS[meal.mealType])}</span>
                      <h4 className="font-medium text-space-50 mt-1">{meal.title}</h4>
                      <p className="text-sm text-gray-400 mt-1">{meal.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-space-400">
                        {!!meal.estimatedCalories && <span>{meal.estimatedCalories} {t('mealPlan.aiGenerator.kcal')}</span>}
                        {!!meal.estimatedCookingTime && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {meal.estimatedCookingTime} {t('mealPlan.aiGenerator.min')}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddToPlan(planDay.day, meal)}
                        disabled={isAdding || isAdded}
                        className="btn-cyber-outline w-full flex items-center justify-center gap-2 text-sm mt-3"
                      >
                        {isAdded ? (
                          <>
                            <Check size={14} />
                            {t('mealPlan.aiGenerator.added')}
                          </>
                        ) : isAdding ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            {t('mealPlan.aiGenerator.adding')}
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            {t('mealPlan.aiGenerator.addToPlan')}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
