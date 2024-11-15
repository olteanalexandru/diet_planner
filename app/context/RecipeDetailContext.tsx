'use client';
import React, { createContext, useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types/recipe';
import { Comment } from '../types/comment';
import { recipeService } from '../services/recipeService';
interface RecipeDetailContextType {
recipe: Recipe | null;
comments: Comment[];
loading: boolean;
commentsLoading: boolean;
error: string | null;
fetchRecipeAndComments: (slug: string[], isId?: boolean) => Promise<void>;
handleLike: () => Promise<void>;
setComments: Dispatch<SetStateAction<Comment[]>>;
}
const RecipeDetailContext = createContext<RecipeDetailContextType | undefined>(undefined);
export function RecipeDetailProvider({ children }: { children: React.ReactNode }) {
const { user } = useUser();
const [recipe, setRecipe] = useState<Recipe | null>(null);
const [comments, setComments] = useState<Comment[]>([]);
const [loading, setLoading] = useState(true);
const [commentsLoading, setCommentsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const fetchRecipeAndComments = async (slugParts: string[], isId: boolean = false) => {
try {
setLoading(true);
setError(null);
const title = decodeURIComponent(slugParts[0]);
  const cookingTime = slugParts[1];
  const recipeId = isId ? title : null;

  // Fetch recipe details
  const recipeResponse = await fetch('/api/getRecipeDetails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      title,
      cookingTime,
      recipeId
    }),
  });

  if (!recipeResponse.ok) {
    const errorData = await recipeResponse.json();
    throw new Error(errorData.error || 'Failed to fetch recipe');
  }

  const { recipe: fetchedRecipe } = await recipeResponse.json();

  // Fetch like status if user is logged in
  if (user && fetchedRecipe.id) {
    const likeStatusResponse = await fetch(`/api/recipes/${fetchedRecipe.id}/like/status`);
    if (likeStatusResponse.ok) {
      const { isLiked, likes } = await likeStatusResponse.json();
      fetchedRecipe.isLiked = isLiked;
      fetchedRecipe._count = {
        ...fetchedRecipe._count,
        likes
      };
    }
  }

  // Fetch comments
  const commentsResponse = await fetch(`/api/comments?recipeId=${fetchedRecipe.id}`);
  if (!commentsResponse.ok) {
    throw new Error('Failed to fetch comments');
  }
  const { comments: fetchedComments } = await commentsResponse.json();
  
  // Update recipe with actual comment count
  fetchedRecipe._count = {
    ...fetchedRecipe._count,
    comments: fetchedComments.length
  };

  setRecipe(fetchedRecipe);
  setComments(fetchedComments);
} catch (error) {
  console.error('Error:', error);
  setError(error instanceof Error ? error.message : 'An error occurred');
} finally {
  setLoading(false);
  setCommentsLoading(false);
}
};
const handleLike = async () => {
if (!user || !recipe) return;
try {
  const response = await fetch(`/api/recipes/${recipe.id}/like`, {
    method: recipe.isLiked ? 'DELETE' : 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to update like status');
  }

  const { likes } = await response.json();
  
  setRecipe(prev => prev ? {
    ...prev,
    isLiked: !prev.isLiked,
    _count: {
      ...prev._count,
      likes
    }
  } : null);
} catch (error) {
  console.error('Error updating like:', error);
  setError('Failed to update like status');
}
};
useEffect(() => {
if (recipe) {
setRecipe(prev => prev ? {
...prev,
_count: {
...prev._count,
comments: comments.length
}
} : null);
}
}, [comments.length]);
const value = {
recipe,
comments,
loading,
commentsLoading,
error,
fetchRecipeAndComments,
handleLike,
setComments,
};
return (
<RecipeDetailContext.Provider value={value}>
{children}
</RecipeDetailContext.Provider>
);
}
export function useRecipeDetail() {
const context = useContext(RecipeDetailContext);
if (context === undefined) {
throw new Error('useRecipeDetail must be used within a RecipeDetailProvider');
}
return context;
}
