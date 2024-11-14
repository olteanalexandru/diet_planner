import React, { useState } from 'react';
import { Recipe } from '@/app/types';
import { X, Loader2, Plus, Minus } from 'lucide-react';

interface RecipeEditModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRecipe: Recipe) => void;
}

export const RecipeEditModal: React.FC<RecipeEditModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: recipe.title,
    ingredients: [...recipe.ingredients],
    instructions: [...recipe.instructions],
    cookingTime: recipe.cookingTime,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cookingTime: Number(formData.cookingTime),
          ingredients: formData.ingredients.filter(Boolean),
          instructions: formData.instructions.filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      const { recipe: updatedRecipe } = await response.json();
      onSuccess(updatedRecipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
    } finally {
      setLoading(false);
    }
  };

  // Only render if modal is open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-space-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Edit Recipe</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                    />
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            ingredients: prev.ingredients.filter((_, i) => i !== index)
                          }));
                        }}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                      >
                        <Minus size={20} />
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
                    />
                    {formData.instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            instructions: prev.instructions.filter((_, i) => i !== index)
                          }));
                        }}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                      >
                        <Minus size={20} />
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

            <div className="flex justify-end gap-4 pt-4 border-t border-space-700">
              <button
                type="button"
                onClick={onClose}
                className="btn-cyber-outline"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-cyber"
                disabled={loading}
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
          </form>
        </div>
      </div>
    </div>
  );
};