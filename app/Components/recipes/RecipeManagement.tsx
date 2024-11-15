import React, { useState } from 'react';
import { Recipe } from '@/app/types';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RecipeEditModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRecipe: Recipe) => void;
}

export const RecipeManagement: React.FC<RecipeEditModalProps> = ({
  recipe: initialRecipe,
  isOpen,
  onClose,
  onSuccess
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState(initialRecipe);
  const [isDraft, setIsDraft] = useState(initialRecipe.status === 'draft');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recipe,
          status: isDraft ? 'draft' : 'published',
          isPublished: !isDraft,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      const updatedRecipe = await response.json();
      onSuccess(updatedRecipe.recipe);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-space-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Edit Recipe</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-space-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                  className="form-checkbox"
                />
                <span>Save as draft</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={recipe.title}
                onChange={e => setRecipe(prev => ({ ...prev, title: e.target.value }))}
                className="input-cyber w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cooking Time (minutes)</label>
              <input
                type="number"
                value={recipe.cookingTime}
                onChange={e => setRecipe(prev => ({ 
                  ...prev, 
                  cookingTime: Math.max(1, parseInt(e.target.value) || 1)
                }))}
                className="input-cyber w-full"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ingredients</label>
              <div className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={e => {
                        const newIngredients = [...recipe.ingredients];
                        newIngredients[index] = e.target.value;
                        setRecipe(prev => ({ ...prev, ingredients: newIngredients }));
                      }}
                      className="input-cyber w-full"
                      placeholder={`Ingredient ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newIngredients = recipe.ingredients.filter((_, i) => i !== index);
                        setRecipe(prev => ({ ...prev, ingredients: newIngredients }));
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRecipe(prev => ({
                    ...prev,
                    ingredients: [...prev.ingredients, '']
                  }))}
                  className="btn-cyber-outline w-full"
                >
                  Add Ingredient
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Instructions</label>
              <div className="space-y-2">
                {recipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={instruction}
                      onChange={e => {
                        const newInstructions = [...recipe.instructions];
                        newInstructions[index] = e.target.value;
                        setRecipe(prev => ({ ...prev, instructions: newInstructions }));
                      }}
                      className="input-cyber w-full"
                      rows={2}
                      placeholder={`Step ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newInstructions = recipe.instructions.filter((_, i) => i !== index);
                        setRecipe(prev => ({ ...prev, instructions: newInstructions }));
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRecipe(prev => ({
                    ...prev,
                    instructions: [...prev.instructions, '']
                  }))}
                  className="btn-cyber-outline w-full"
                >
                  Add Instruction
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t border-space-700">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="btn-cyber-outline bg-red-500/10 hover:bg-red-500/20 text-red-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Recipe'
                )}
              </button>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="btn-cyber-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-cyber"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};