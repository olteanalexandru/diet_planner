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
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-100">
        <span className="bg-gradient-to-r from-cyber-primary to-cyber-accent bg-clip-text text-transparent">
          Your Favorites
        </span>
      </h2>
      <div className="grid gap-4">
        {favorites.map((fav) => (
          <div 
            key={fav.id} 
            className="card-cyber flex items-center space-x-4 p-4 hover:scale-[1.01] transition-transform duration-200"
          >
            <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-lg">
              <img
                src={fav.imageUrl}
                alt={fav.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-grow">
              <Link 
                href={`/recipe/${fav.title}/${fav.cookingTime}`}
                className="text-lg font-medium text-gray-100 hover:text-cyber-primary transition-colors duration-200"
              >
                {fav.title}
              </Link>
              <p className="text-gray-400">{fav.cookingTime} minutes</p>
            </div>
            <button
              className="p-2 rounded-lg text-cyber-primary hover:bg-cyber-primary/10 transition-colors duration-200"
              onClick={() => removeFavorite(fav)}
            >
              <Heart size={24} fill="currentColor" />
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
