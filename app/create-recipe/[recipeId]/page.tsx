'use client';

import React from 'react';
import { RecipeForm } from '../../Components/recipes/RecipeForm';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { RecipeFormProvider, useRecipeForm } from '../../context/RecipeFormContext';

function EditRecipeContent() {
  const { recipeId } = useParams();
  const {
    recipe,
    loading,
    error,
    fetchRecipe,
    updateRecipe,
  } = useRecipeForm();

  React.useEffect(() => {
    if (recipeId) {
      fetchRecipe(recipeId as string);
    }
  }, [recipeId, fetchRecipe]);

  if (loading) {
    return (
      <div className="flex-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex-center min-h-[60vh] flex-col gap-4">
        <div>{error || 'Recipe not found'}</div>
        <Link href="/dashboard" className="btn-cyber">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Complete Your Recipe</h1>
              <p className="text-gray-400">
                {recipe.status === 'draft' 
                  ? 'Finish your draft recipe' 
                  : 'Customize and publish your saved recipe'}
              </p>
            </div>
            {recipe.originalId && (
              <Link
                href={`/recipe/${recipe.originalId}`}
                className="btn-cyber-outline"
              >
                View Original
              </Link>
            )}
          </div>
          
          <div className="card-cyber p-8">
            <RecipeForm
              initialData={recipe}
              onSubmit={(data) => updateRecipe(recipeId as string, data)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditDraftRecipe() {
  return (
    <RecipeFormProvider>
      <EditRecipeContent />
    </RecipeFormProvider>
  );
}
