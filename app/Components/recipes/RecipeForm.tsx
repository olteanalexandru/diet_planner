'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Loader2, ImagePlus } from 'lucide-react';

export const RecipeForm = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [cookingTime, setCookingTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          ingredients: ingredients.filter(i => i.trim() !== ''),
          instructions: instructions.filter(i => i.trim() !== ''),
          cookingTime: parseInt(cookingTime),
          imageUrl
        }),
      });
      
      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'An error occurred while submitting the recipe');
      }
    } catch (error) {
      console.error('Error submitting recipe:', error);
      setError('An error occurred while submitting the recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* Title & Time */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="form-group">
          <label htmlFor="title" className="form-label">Recipe Title</label>
          <input
            type="text"
            id="title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter recipe title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cookingTime" className="form-label">Cooking Time (minutes)</label>
          <input
            type="number"
            id="cookingTime"
            className="form-input"
            value={cookingTime}
            onChange={(e) => setCookingTime(e.target.value)}
            placeholder="Enter cooking time"
            required
          />
        </div>
      </div>

      {/* Image URL */}
      <div className="form-group">
        <label htmlFor="imageUrl" className="form-label">Image URL</label>
        <div className="relative">
          <input
            type="url"
            id="imageUrl"
            className="form-input pl-10"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL"
          />
          <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Ingredients */}
      <div className="form-group">
        <div className="flex justify-between items-center mb-4">
          <label className="form-label m-0">Ingredients</label>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="btn-cyber-outline py-1 px-2"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                className="form-input"
                value={ingredient}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                placeholder={`Ingredient ${index + 1}`}
                required
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="btn-cyber-outline py-2 px-2"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="form-group">
        <div className="flex justify-between items-center mb-4">
          <label className="form-label m-0">Instructions</label>
          <button
            type="button"
            onClick={handleAddInstruction}
            className="btn-cyber-outline py-1 px-2"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-2">
              <textarea
                className="form-textarea"
                value={instruction}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
                required
              />
              {instructions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveInstruction(index)}
                  className="btn-cyber-outline py-2 px-2"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-cyber px-8 py-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Recipe...
            </>
          ) : (
            'Create Recipe'
          )}
        </button>
      </div>
    </form>
  );
};