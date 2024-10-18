'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Recipe } from '../types';
import { useFavorites } from '../context/FavoritesContext';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFavorite = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isFavorite(recipe)) {
        await removeFavorite(recipe);
      } else {
        await addFavorite(recipe);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError('Failed to update favorite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center bg-light p-3 rounded mb-3" style={{ boxShadow: '0 6px 10px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ flexShrink: 0, height: '100%' }}>
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="me-3"
          style={{ height: 'auto', borderRadius: '8px', maxWidth: '80px', maxHeight: '100px' }}
        />
      </div>
      <div className="flex-grow-1">
        <h2 className="h5 mb-1">
          <Link href={`/recipe/${recipe.title}/${recipe.cookingTime}`} className="text-decoration-none" style={{ color: 'black' }}>
            {recipe.title}
          </Link>
        </h2>
        <p className="mb-0">{recipe.cookingTime} min.</p>
      </div>
      <button
        className="btn btn-link"
        onClick={toggleFavorite}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ) : (
          <Heart size={24} color="#65558F" fill={isFavorite(recipe) ? '#65558F' : 'none'} />
        )}
      </button>
      {error && <div className="text-danger">{error}</div>}
    </div>
  );
};