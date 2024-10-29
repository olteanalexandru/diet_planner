
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

  const isEditMode = pathname.endsWith('/edit');

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!params?.slug) return;

      try {
        setLoading(true);
        setError(null);

        // Handle the title and cookingTime from URL
        const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug];
        const title = decodeURIComponent(slugParts[0]);
        const cookingTime = slugParts[1];

        // Changed to POST request
        const response = await fetch('/api/getRecipeDetails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title,
            cookingTime: cookingTime || "30"
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch recipe');
        }

        const data = await response.json();
        setRecipe(data.recipe);

      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [params?.slug]);

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
      />
      <div ref={commentsRef} id="comments" className="scroll-mt-20" />
    </>
  );
}