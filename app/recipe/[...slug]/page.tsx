'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Recipe } from '@/app/types';
import { RecipeDetail } from '@/app/Components/recipes/RecipeDetail';
import { RecipeForm } from '@/app/Components/recipes/RecipeForm';
import { Loader2 } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function RecipePage() {
  const router = useRouter();
  const { user } = useUser();
  const params = useParams();
  const pathname = usePathname();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const isEditMode = pathname.endsWith('/edit');

  useEffect(() => {
    const fetchRecipeAndComments = async () => {
      if (!params?.slug) return;

      try {
        setLoading(true);
        setError(null);

        const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug];
        const title = decodeURIComponent(slugParts[0]);
        const cookingTime = slugParts[1];

        // First get recipe details to get the ID
        const recipeResponse = await fetch('/api/getRecipeDetails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title,
            cookingTime: cookingTime || "30"
          }),
        });

        if (!recipeResponse.ok) {
          const errorData = await recipeResponse.json();
          throw new Error(errorData.error || 'Failed to fetch recipe');
        }

        const { recipe: fetchedRecipe } = await recipeResponse.json();

        // Then fetch like status using the recipe ID
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
        const { comments } = await commentsResponse.json();
        
        // Update recipe with actual comment count
        fetchedRecipe._count = {
          ...fetchedRecipe._count,
          comments: comments.length
        };

        setRecipe(fetchedRecipe);
        setComments(comments);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
        setCommentsLoading(false);
      }
    };

    fetchRecipeAndComments();
  }, [params?.slug, user]);

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

  if (loading) {
    return (
      <div className="flex-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center min-h-[60vh] flex-col gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-cyber-outline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex-center min-h-[60vh]">
        <p className="text-gray-400">Recipe not found</p>
      </div>
    );
  }

  if (isEditMode && recipe.isOwner) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Edit Recipe</h1>
          <RecipeForm 
            initialData={{
              ...recipe,
              // Add all the new fields from the recipe
              description: recipe.description || '',
              prepTime: recipe.prepTime || null,
              totalTime: recipe.totalTime || null,
              calories: recipe.calories || null,
              protein: recipe.protein || null,
              carbs: recipe.carbs || null,
              fat: recipe.fat || null,
              // Keep existing fields
              ingredients: recipe.ingredients,
              instructions: recipe.instructions,
              cookingTime: recipe.cookingTime,
              servings: recipe.servings,
              difficulty: recipe.difficulty,
              category: recipe.category,
              cuisine: recipe.cuisine,
              tags: recipe.tags,
              dietaryInfo: recipe.dietaryInfo,
              status: recipe.status,
            }} 
            mode="edit"
            onSubmit={async (updatedRecipe) => {
              try {
                const response = await fetch(`/api/recipes/${recipe.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...updatedRecipe,
                    // Ensure numeric fields are properly typed
                    prepTime: updatedRecipe.prepTime ? parseInt(String(updatedRecipe.prepTime)) : null,
                    totalTime: updatedRecipe.totalTime ? parseInt(String(updatedRecipe.totalTime)) : null,
                    calories: updatedRecipe.calories ? parseInt(String(updatedRecipe.calories)) : null,
                    protein: updatedRecipe.protein ? parseFloat(String(updatedRecipe.protein)) : null,
                    carbs: updatedRecipe.carbs ? parseFloat(String(updatedRecipe.carbs)) : null,
                    fat: updatedRecipe.fat ? parseFloat(String(updatedRecipe.fat)) : null,
                  }),
                });
                
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Failed to update recipe');
                }
                
                const data = await response.json();
                router.push(`/recipe/${encodeURIComponent(data.recipe.title)}/${data.recipe.cookingTime}`);
              } catch (error) {
                console.error('Error updating recipe:', error);
                setError('Failed to update recipe');
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <RecipeDetail 
        recipe={recipe}
        isGeneratedRecipe={!recipe.authorId}
        onLike={handleLike}
        comments={comments}
        setComments={setComments}
        commentsLoading={commentsLoading}
      />
      <div ref={commentsRef} id="comments" className="scroll-mt-20" />
    </>
  );
}