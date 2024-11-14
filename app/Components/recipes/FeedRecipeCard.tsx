import React, { useState } from 'react';
import { Heart, Share2, MessageCircle } from 'lucide-react';
import { Recipe } from '@/app/types';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

interface FeedRecipeCardProps {
  recipe: Recipe;
  onLike?: (recipeId: string) => Promise<void>;
  onUnlike?: (recipeId: string) => Promise<void>;
}

export const FeedRecipeCard: React.FC<FeedRecipeCardProps> = ({
  recipe,
  onLike,
  onUnlike
}) => {
  const router = useRouter();
  const { user } = useUser();
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      router.push('/api/auth/login');
      return;
    }

    if (isLikeLoading || !recipe.id) return;

    setIsLikeLoading(true);
    try {
      if (recipe.isLiked) {
        await onUnlike?.(recipe.id);
      } else {
        await onLike?.(recipe.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  return (
    <div className="card-cyber group hover:border-cyber-primary/50 transition-all duration-200">
      <Link 
        href={`/recipe/${encodeURIComponent(recipe.title)}/${recipe.cookingTime}`}
        className="block p-4"
      >
        {/* Card Content */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Image */}
          <div className="w-full md:w-48 h-48 md:h-32 rounded-lg overflow-hidden">
            <img
              src={recipe.imageUrl || '/placeholder-recipe.jpg'}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>

          {/* Content */}
          <div className="flex-grow">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold line-clamp-1">{recipe.title}</h3>
                <p className="text-sm text-gray-400">{recipe.cookingTime} mins • {recipe.category}</p>
              </div>

              {/* Tags */}
              <div className="flex gap-2">
                {recipe.tags?.slice(0, 2).map((tag: string) => (
                  <span 
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-cyber-primary/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="flex items-center gap-4 mt-4 text-gray-400">
              <button
                onClick={handleLikeClick}
                disabled={isLikeLoading}
                className={`flex items-center gap-2 transition-colors ${
                  isLikeLoading ? 'opacity-50 cursor-not-allowed' : ''
                } ${recipe.isLiked ? 'text-cyber-primary' : 'hover:text-cyber-primary'}`}
              >
                <Heart 
                  size={20} 
                  className={recipe.isLiked ? 'fill-current' : ''} 
                />
                <span>{recipe._count?.likes || 0}</span>
              </button>

              <div className="flex items-center gap-2">
                <MessageCircle size={20} />
                <span>{recipe._count?.comments || 0}</span>
              </div>

              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.share({
                    title: recipe.title,
                    text: `Check out this recipe: ${recipe.title}`,
                    url: window.location.origin + `/recipe/${recipe.id}`
                  });
                }}
                className="hover:text-cyber-primary"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};