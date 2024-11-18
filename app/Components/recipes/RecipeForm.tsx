'use client';
import React, { useState } from 'react';
import { Recipe } from '../../types';
import { Loader2, Plus, X } from 'lucide-react';
import { CATEGORIES, DIFFICULTY_LEVELS ,DIETARY_TAGS,CUISINE_TAGS } from '@/app/utils/constants';

interface RecipeFormProps {
  initialData?: Partial<Recipe>;
  mode?: 'create' | 'edit';
  onSubmit: (data: Partial<Recipe>) => Promise<void>;
  onDelete?: () => Promise<void>;
}



export const RecipeForm: React.FC<RecipeFormProps> = ({
  initialData,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    ingredients: initialData?.ingredients || [''],
    instructions: initialData?.instructions || [''],
    cookingTime: initialData?.cookingTime || 30,
    servings: initialData?.servings || 4,
    difficulty: initialData?.difficulty || 'medium',
    category: (initialData?.category as 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'snack' | 'beverage') || 'dinner',
    tags: initialData?.tags || [],
    dietaryInfo: initialData?.dietaryInfo || {
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isDairyFree: false,
    },
    customTags: [] as string[],
    newTag: '',
    status: initialData?.status || 'published',
    description: initialData?.description || '',
    prepTime: initialData?.prepTime || 15,
    totalTime: initialData?.totalTime || 45,
    calories: initialData?.calories || undefined,
    protein: initialData?.protein || undefined,
    carbs: initialData?.carbs || undefined,
    fat: initialData?.fat || undefined,
  });

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'published') => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create dietary info from tags
      const dietaryInfo = {
        isVegetarian: formData.tags.includes('Vegetarian'),
        isVegan: formData.tags.includes('Vegan'),
        isGlutenFree: formData.tags.includes('Gluten-Free'),
        isDairyFree: formData.tags.includes('Dairy-Free'),
      };

      // Extract cuisine type from tags
      const cuisineTag = formData.tags.find(tag => CUISINE_TAGS.includes(tag as typeof CUISINE_TAGS[number]));

      const recipeData = {
        ...formData,
        status,
        // Ensure category is one of the valid categories
        category: (CATEGORIES.map(c => c.id) as readonly string[]).includes(formData.category) 
          ? formData.category 
          : 'other',
        // Combine custom tags and selected tags
        tags: Array.from(new Set([...formData.tags, ...formData.customTags])),
        // Add dietary info
        dietaryInfo,
        // Add cuisine if found
        cuisine: cuisineTag || undefined,
        // Remove form-specific fields
        customTags: undefined,
        newTag: undefined,
      };

      await onSubmit(recipeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (formData.newTag.trim() && !formData.customTags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        customTags: [...prev.customTags, prev.newTag.trim()],
        newTag: '',
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      customTags: prev.customTags.filter(t => t !== tag),
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, 'published')} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="input-cyber w-full"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="input-cyber w-full"
          rows={3}
          placeholder="Brief description of your recipe..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Cooking Time (minutes)</label>
          <input
            type="number"
            value={formData.cookingTime}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              cookingTime: Math.max(1, parseInt(e.target.value) || 1)
            }))}
            className="input-cyber w-full"
            required
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Servings</label>
          <input
            type="number"
            value={formData.servings}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              servings: Math.max(1, parseInt(e.target.value) || 1)
            }))}
            className="input-cyber w-full"
            required
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Prep Time (minutes)</label>
          <input
            type="number"
            value={formData.prepTime}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              prepTime: Math.max(0, parseInt(e.target.value) || 0)
            }))}
            className="input-cyber w-full"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Total Time (minutes)</label>
          <input
            type="number"
            value={formData.totalTime}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              totalTime: Math.max(0, parseInt(e.target.value) || 0)
            }))}
            className="input-cyber w-full"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={e => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
            className="input-cyber w-full"
            required
          >
            {DIFFICULTY_LEVELS.map(level => (
              <option key={level.id} value={level.id}>
                {level.icon} {level.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Calories</label>
          <input
            type="number"
            value={formData.calories || ''}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              calories: e.target.value ? parseInt(e.target.value) : undefined
            }))}
            className="input-cyber w-full"
            min="0"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Protein (g)</label>
          <input
            type="number"
            value={formData.protein || ''}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              protein: e.target.value ? parseFloat(e.target.value) : undefined
            }))}
            className="input-cyber w-full"
            min="0"
            step="0.1"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Carbs (g)</label>
          <input
            type="number"
            value={formData.carbs || ''}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              carbs: e.target.value ? parseFloat(e.target.value) : undefined
            }))}
            className="input-cyber w-full"
            min="0"
            step="0.1"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fat (g)</label>
          <input
            type="number"
            value={formData.fat || ''}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              fat: e.target.value ? parseFloat(e.target.value) : undefined
            }))}
            className="input-cyber w-full"
            min="0"
            step="0.1"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
              className={`p-4 rounded-lg border transition-colors ${
                formData.category === category.id
                  ? 'bg-cyber-primary/10 border-cyber-primary'
                  : 'border-space-600 hover:border-cyber-primary'
              }`}
            >
              <span className="text-2xl mb-2">{category.icon}</span>
              <span className="block">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Dietary Information</label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                tags: prev.tags.includes(tag)
                  ? prev.tags.filter(t => t !== tag)
                  : [...prev.tags, tag]
              }))}
              className={`px-3 py-1 rounded-full border transition-colors ${
                formData.tags.includes(tag)
                  ? 'bg-cyber-primary/10 border-cyber-primary'
                  : 'border-space-600 hover:border-cyber-primary'
              }`}
              >
                {tag}
              </button>
            ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Cuisine Type</label>
        <div className="flex flex-wrap gap-2">
          {CUISINE_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                tags: prev.tags.includes(tag)
                  ? prev.tags.filter(t => t !== tag)
                  : [...prev.tags, tag]
              }))}
              className={`px-3 py-1 rounded-full border transition-colors ${
                formData.tags.includes(tag)
                  ? 'bg-cyber-primary/10 border-cyber-primary'
                  : 'border-space-600 hover:border-cyber-primary'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">Custom Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.customTags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-cyber-primary/10 border border-cyber-primary flex items-center gap-2"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-400"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.newTag}
            onChange={e => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="input-cyber flex-grow"
            placeholder="Add custom tag..."
          />
          <button
            type="button"
            onClick={addTag}
            className="btn-cyber-outline"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Ingredients</label>
        <div className="space-y-2">
          {formData.ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={ingredient}
                onChange={e => {
                  const newIngredients = [...formData.ingredients];
                  newIngredients[index] = e.target.value;
                  setFormData(prev => ({ ...prev, ingredients: newIngredients }));
                }}
                className="input-cyber flex-grow"
                placeholder={`Ingredient ${index + 1}`}
                required
              />
              {formData.ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
                  }}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData(prev => ({
              ...prev,
              ingredients: [...prev.ingredients, '']
            }))}
            className="btn-cyber-outline w-full flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Ingredient
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Instructions</label>
        <div className="space-y-2">
          {formData.instructions.map((instruction, index) => (
            <div key={index} className="flex gap-2">
              <textarea
                value={instruction}
                onChange={e => {
                  const newInstructions = [...formData.instructions];
                  newInstructions[index] = e.target.value;
                  setFormData(prev => ({ ...prev, instructions: newInstructions }));
                }}
                className="input-cyber flex-grow"
                rows={2}
                placeholder={`Step ${index + 1}`}
                required
              />
              {formData.instructions.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newInstructions = formData.instructions.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, instructions: newInstructions }));
                  }}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData(prev => ({
              ...prev,
              instructions: [...prev.instructions, '']
            }))}
            className="btn-cyber-outline w-full flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Instruction
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6">
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'draft')}
          disabled={loading}
          className="btn-cyber-outline"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save as Draft'
          )}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-cyber"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish Recipe'
          )}
        </button>
      </div>
    </form>
  );
};
