'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { RecipeForm } from '../../Components/recipes/RecipeForm';
import { Loader2 } from 'lucide-react';
import { Recipe } from '../../types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditDraftRecipe() {
    const { recipeId } = useParams();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    
    useEffect(() => {
      const fetchRecipe = async () => {
        try {
          const response = await fetch(`/api/recipes/${recipeId}`);
          if (!response.ok) throw new Error('Failed to fetch recipe');
          
          const data = await response.json();
          setRecipe(data.recipe);
        } catch (error) {
          console.error('Error fetching recipe:', error);
        } finally {
          setLoading(false);
        }
      };
  
      if (recipeId) {
        fetchRecipe();
      }
    }, [recipeId]);
  
    const handleSubmit = async (data: Partial<Recipe>) => {
      try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
  
        if (!response.ok) throw new Error('Failed to update recipe');
        
        const { recipe: updatedRecipe } = await response.json();

        // Redirect based on status
        if (data.status === 'draft') {
          router.push('/dashboard'); // Drafts are shown in dashboard
        } else {
          router.push(`/recipe/${encodeURIComponent(updatedRecipe.title)}/${updatedRecipe.cookingTime}`);
        }
      } catch (error) {
        console.error('Error updating recipe:', error);
      }
    };
  
    if (loading) {
      return (
        <div className="flex-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
        </div>
      );
    }
  
    if (!recipe) {
      return (
        <div className="flex-center min-h-[60vh] flex-col gap-4">
          <div>Recipe not found</div>
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
                  {recipe.status === 'draft' ? 'Finish your draft recipe' : 'Customize and publish your saved recipe'}
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
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
