'use client';
import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

export const RecipeForm: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [cookingTime, setCookingTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to submit a recipe');
      return;
    }

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, ingredients, instructions, cookingTime, imageUrl }),
      });
      
      if (response.ok) {
        setSuccess(true);
        setError(null);
        // Clear form
        setTitle('');
        setIngredients(['']);
        setInstructions(['']);
        setCookingTime('');
        setImageUrl('');
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'An error occurred while submitting the recipe');
      }
    } catch (error) {
      console.error('Error submitting recipe:', error);
      setError('An error occurred while submitting the recipe');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <h2>Submit a New Recipe</h2>
      {error && <p className="text-danger">{error}</p>}
      {success && <p className="text-success">Recipe submitted successfully!</p>}
      <div className="mb-3">
        <label htmlFor="title" className="form-label">Title</label>
        <input
          type="text"
          className="form-control"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Ingredients</label>
        {ingredients.map((ingredient, index) => (
          <input
            key={index}
            type="text"
            className="form-control mb-2"
            value={ingredient}
            onChange={(e) => handleIngredientChange(index, e.target.value)}
            required
          />
        ))}
        <button type="button" className="btn btn-secondary" onClick={handleAddIngredient}>
          Add Ingredient
        </button>
      </div>
      <div className="mb-3">
        <label className="form-label">Instructions</label>
        {instructions.map((instruction, index) => (
          <textarea
            key={index}
            className="form-control mb-2"
            value={instruction}
            onChange={(e) => handleInstructionChange(index, e.target.value)}
            required
          />
        ))}
        <button type="button" className="btn btn-secondary" onClick={handleAddInstruction}>
          Add Instruction
        </button>
      </div>
      <div className="mb-3">
        <label htmlFor="cookingTime" className="form-label">Cooking Time (minutes)</label>
        <input
          type="number"
          className="form-control"
          id="cookingTime"
          value={cookingTime}
          onChange={(e) => setCookingTime(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="imageUrl" className="form-label">Image URL</label>
        <input
          type="url"
          className="form-control"
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">Submit Recipe</button>
    </form>
  );
};