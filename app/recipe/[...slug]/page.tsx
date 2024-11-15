'use client';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RecipeDetail } from '../../Components/recipes/RecipeDetail';
import { RecipeForm } from '../../Components/recipes/RecipeForm';
import { Loader2 } from 'lucide-react';
import { RecipeDetailProvider, useRecipeDetail } from '../../context/RecipeDetailContext';

function RecipeContent() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const {
    recipe,
    comments,
    loading,
    commentsLoading,
    error,
    fetchRecipeAndComments,
    handleLike,
    setComments
  } = useRecipeDetail();
  const isEditMode = pathname.endsWith('/edit');

  useEffect(() => {
    if (params?.slug) {
      const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug];
      const hasNoTime = slugParts.length === 1;
      fetchRecipeAndComments(slugParts, hasNoTime);
    }
  }, [params?.slug, fetchRecipeAndComments.length > 0]);

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

  // Add new function to handle saving
  const handleSaveRecipe = async (asDraft: boolean) => {
    try {
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recipe,
          status: asDraft ? 'draft' : 'published',
          isPublished: !asDraft
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save recipe');
      }

      const data = await response.json();
      router.push(`/recipe/${encodeURIComponent(data.recipe.title)}/${data.recipe.cookingTime}`);
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };



  if (isEditMode && recipe.isOwner) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Edit Recipe</h1>
          <RecipeForm
            initialData={recipe}
            mode="edit"
            onSubmit={async (updatedRecipe) => {
              try {
                const response = await fetch(`/api/recipes/${recipe.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedRecipe),
                });
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Failed to update recipe');
                }

                const data = await response.json();
                router.push(`/recipe/${encodeURIComponent(data.recipe.title)}/${data.recipe.cookingTime}`);
              } catch (error) {
                console.error('Error updating recipe:', error);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <RecipeDetail 
      recipe={recipe}
      isGeneratedRecipe={!recipe.authorId}
      onLike={handleLike}
      comments={comments}
      setComments={setComments}
      commentsLoading={commentsLoading}
      isPublished={recipe.isPublished}
    />
  );
}

export default function RecipePage() {
  return (
    <RecipeDetailProvider>
      <RecipeContent />
    </RecipeDetailProvider>
  );
}