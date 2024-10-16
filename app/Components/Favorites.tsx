import React, { useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { usePathname } from 'next/navigation';
import {  Recipe, FavouriteRecipeComponentProps } from '../types';

export default function Favorites() {
  const { favorites, removeFavorite } = useFavorites();
  const pathname = usePathname();

  if (pathname !== '/') {
    return null;
  }

  if (favorites.length < 1) {
    return null;
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4 h2" style={{ fontWeight: 'bold' }}>Favorites</h2>
      <div className="row">
        {favorites.map((fav) => (
          <div key={fav.id} className="d-flex align-items-center bg-light rounded mb-3" style={{ boxShadow: '0 6px 10px rgba(0, 0, 0, 0.1)', paddingLeft: 0 }}>
            <div style={{ flexShrink: 0 }}>
              <img
                src={fav.imageUrl}
                alt={fav.title}
                className="me-3"
                style={{ height: 'auto', borderRadius: '8px' , maxWidth: '80px', maxHeight: '100px' }}
              />
            </div>
            <div className="flex-grow-1">
              <h2 className="h5 mb-1">
                <Link href={`/recipe/${fav.title}/${fav.cookingTime}`} className="text-decoration-none" style={{ color: 'black' }}>
                  {fav.title}
                </Link>
              </h2>
              <p className="mb-0">{fav.cookingTime} min.</p>
            </div>
            <button
              className="btn btn-link text-muted"
              onClick={() => removeFavorite(fav)}
            >
              <Heart size={24} color="#65558F" fill="#65558F" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}




export const FavouriteRecipeComponent: React.FC<FavouriteRecipeComponentProps> = ({ recipe, favorites, setFavorites }) => {

  const toggleFavorite = (recipe: Recipe): void => {
    const exists = favorites.some((fav) => fav.title === recipe.title && fav.cookingTime === recipe.cookingTime);
    
    if (exists) {
      setFavorites(favorites.filter((fav) => fav.title !== recipe.title || fav.cookingTime !== recipe.cookingTime));
    } else {
      const newFavorite: Recipe = { ...recipe };
      setFavorites([...favorites, newFavorite]);
    }
  };

  useEffect(() => {
    console.log("New Favorites: ", favorites);
  }, [favorites]);

  const isFavorite = favorites.some((fav) => fav.title == recipe.title && fav.cookingTime == recipe.cookingTime);

  return (
    <Heart
      size={24}
      color='#65558F'
      onClick={() => toggleFavorite(recipe)}
      fill={isFavorite ? '#65558F' : 'none'}
    />
  );
};
