'use client';
import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Recipe } from '../types';
import { useFavorites } from '../context/FavoritesContext';

const Heart = dynamic(() => import('lucide-react').then((mod) => mod.Heart), { ssr: false });

interface RecipeCardProps {
  recipe: Recipe
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const toggleFavorite = () => {
    const favoriteRecipe = { ...recipe }; 
    if (isFavorite(favoriteRecipe)) {
      removeFavorite(favoriteRecipe);
    } else {
      addFavorite(favoriteRecipe);
    }
  };

  
  return (
    <div className="d-flex align-items-center bg-light p-3 rounded mb-3" style={{ boxShadow: '0 6px 10px rgba(0, 0, 0, 0.1)', paddingLeft: 0 }}>
      <div style={{ flexShrink: 0, height: '100%' }}>
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="me-3"
          style={{ height: 'auto', borderRadius: '8px' , maxWidth: '80px', maxHeight: '100px' }}
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
      >
        <Heart size={24} color="#65558F" fill={isFavorite({ ...recipe }) ? '#65558F' : 'none'} />
      </button>
    </div>
  );
  
  
};



