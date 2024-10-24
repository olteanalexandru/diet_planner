import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Clock, ChevronRight } from 'lucide-react';
import { Recipe } from '../../types';
import { useFavorites } from '../../context/FavoritesContext';

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
      setError('Failed to update favorite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="card-cyber group relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px]">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4">
          {/* Image Container */}
          <div className="w-full md:w-48 h-48 md:h-32 relative rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={recipe.imageUrl || '/placeholder-recipe.jpg'}
              alt={recipe.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Content Container */}
          <div className="flex-grow min-w-0 w-full">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-grow space-y-2">
                <Link 
                  href={`/recipe/${recipe.title}/${recipe.cookingTime}`}
                  className="block text-xl font-semibold text-gray-100 hover:text-cyber-primary line-clamp-2 transition-colors duration-200"
                >
                  {recipe.title}
                </Link>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-gray-400">
                    <Clock size={16} className="mr-1" />
                    <span>{recipe.cookingTime} minutes</span>
                  </div>
                  {recipe.author && (
                    <div className="text-sm text-gray-400">
                      by <span className="text-cyber-primary">{recipe.author.name}</span>
                    </div>
                  )}
                </div>

                {/* Preview Content  -- MIGHT WANT TO ALSO ADD INGREDIENTS IN THE FUTURE*/}
                <div className="text-gray-400 text-sm line-clamp-2">
                  {recipe.ingredients?.slice(0, 3).join(', ')}
                  {recipe.ingredients?.length > 3 && '...'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col items-center gap-2">
                <button
                  onClick={toggleFavorite}
                  disabled={isLoading}
                  className="btn-cyber-outline p-2"
                >
                  <Heart
                    size={20}
                    fill={isFavorite(recipe) ? 'currentColor' : 'none'}
                    className={isLoading ? 'animate-pulse' : ''}
                  />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-2 text-xs text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Hover Effect Link */}
        <div className="absolute inset-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none pr-4">
          <ChevronRight className="text-cyber-primary" size={24} />
        </div>
      </div>
    </div>
  );
};