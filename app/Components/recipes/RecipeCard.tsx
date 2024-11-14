import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, ChefHat } from 'lucide-react';
import { Recipe } from '../../types';
import { useFavorites } from '../../context/FavoritesContext';
import { formatDistance } from 'date-fns';

interface RecipeCardProps {
  recipe: Recipe;
  isAIGenerated?: boolean; // New prop to determine if this is just an AI suggestion
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, isAIGenerated = false }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [isLiked, setIsLiked] = useState(() => isFavorite(recipe));
  const [likeCount, setLikeCount] = useState(recipe._count?.likes || 0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const handleLike = async () => {
    if (isLikeLoading) return;
    setIsLikeLoading(true);

    try {
      const response = await fetch(`/api/recipes/${recipe.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      });

      if (!response.ok) throw new Error('Failed to toggle like');
      
      const { likes } = await response.json();
      setLikeCount(likes);
      setIsLiked(!isLiked);

      if (isLiked) {
        await removeFavorite(recipe);
      } else {
        await addFavorite(recipe);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLikeLoading(false);
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

  const recipeUrl = `/recipe/${encodeURIComponent(recipe.title)}/${recipe.cookingTime}`;

  return (
    <article className="card-cyber overflow-hidden group">
      {/* Header with author info - only show for full recipes */}
      {!isAIGenerated && recipe.authorId && (
        <div className="p-4 flex items-center justify-between">
          <Link
            href={`/profile/${recipe.authorId}`}
            className="flex items-center gap-2 hover:text-cyber-primary transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-cyber-primary/10 flex items-center justify-center">
              <ChefHat size={20} />
            </div>
            <div>
              <span className="font-medium">Author</span>
              <p className="text-sm text-gray-400">
                {formatDistance(new Date(recipe.createdAt), new Date(), { addSuffix: true })}
              </p>
            </div>
          </Link>

          {/* Recipe Tags */}
          <div className="flex gap-2">
            {recipe.tags?.slice(0, 2).map((tag: string) => (
              <span 
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-space-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recipe Image and Title */}
      <Link href={recipeUrl}>
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={recipe.imageUrlLarge || recipe.imageUrl || '/placeholder-recipe.jpg'}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {recipe.title}
            </h2>
            
            <div className="flex items-center gap-4 text-gray-200 text-sm">
              <span>{recipe.cookingTime} mins</span>
              <span>{recipe.ingredients?.length} ingredients</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Social Actions - Only show for full recipes */}
      {!isAIGenerated && (
        <div className="p-4 flex items-center justify-between border-t border-space-700">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              disabled={isLikeLoading}
              className={`flex items-center gap-2 hover:text-cyber-primary transition-colors ${
                isLikeLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Heart
                size={20}
                className={isLiked ? 'fill-current text-cyber-primary' : ''}
              />
              <span>{likeCount}</span>
            </button>

            <Link
              href={`${recipeUrl}#comments`}
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
      )}
    </article>
  );
};