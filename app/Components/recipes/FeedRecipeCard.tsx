import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, ChefHat } from 'lucide-react';
import { Recipe } from '../../types';
import { useFavorites } from '../../context/FavoritesContext';
import { formatDistance } from 'date-fns';

export const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [isLiked, setIsLiked] = useState(() => isFavorite(recipe));

  const handleLike = async () => {
    try {
      if (isLiked) {
        await removeFavorite(recipe);
      } else {
        await addFavorite(recipe);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: recipe.title,
        text: `Check out this recipe: ${recipe.title}`,
        url: `${window.location.origin}/recipe/${recipe.id}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <article className="card-cyber overflow-hidden group">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link
          href={`/profile/${recipe.authorId}`}
          className="flex items-center gap-2 hover:text-cyber-primary transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-cyber-primary/10 flex items-center justify-center">
            {recipe.author?.name?.[0] || <ChefHat size={20} />}
          </div>
          <div>
            <span className="font-medium">{recipe.author?.name}</span>
            <p className="text-sm text-gray-400">
              {formatDistance(new Date(recipe.createdAt), new Date(), { addSuffix: true })}
            </p>
          </div>
        </Link>

        {/* Recipe Tags */}
        <div className="flex gap-2">
          {recipe.tags?.slice(0, 2).map(tag => (
            <span 
              key={tag}
              className="px-2 py-1 text-xs rounded-full bg-space-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Recipe Image */}
      <Link href={`/recipe/${recipe.id}`}>
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={recipe.imageUrlLarge || recipe.imageUrl || '/placeholder-recipe.jpg'}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Title Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {recipe.title}
            </h2>
            
            {/* Quick Info */}
            <div className="flex items-center gap-4 text-gray-200 text-sm">
              <span>{recipe.cookingTime} mins</span>
              <span>{recipe.ingredients?.length} ingredients</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="p-4 flex items-center justify-between border-t border-space-700">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 hover:text-cyber-primary transition-colors"
          >
            <Heart
              size={20}
              className={isLiked ? 'fill-cyber-primary text-cyber-primary' : ''}
            />
            <span>{recipe._count?.favorites || 0}</span>
          </button>

          <Link
            href={`/recipe/${recipe.id}#comments`}
            className="flex items-center gap-2 hover:text-cyber-primary transition-colors"
          >
            <MessageCircle size={20} />
            <span>{recipe._count?.comments || 0}</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 hover:text-cyber-primary transition-colors"
          >
            <Share2 size={20} />
          </button>
        </div>

        {/* Diet Badges */}
        <div className="flex gap-2">
          {recipe.dietaryInfo?.isVegetarian && (
            <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs">
              Vegetarian
            </span>
          )}
          {recipe.dietaryInfo?.isVegan && (
            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">
              Vegan
            </span>
          )}
        </div>
      </div>
    </article>
  );
};