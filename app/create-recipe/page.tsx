'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { RecipeForm } from '../Components/recipes/RecipeForm';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Recipe } from '../types/index';

export default function CreateRecipe() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const handleSubmit = async (data: Partial<Recipe>): Promise<void> => {
    const route = '/api/recipes/';

    const response = await fetch(route, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // Use the status from the form data
    });

    if (!response.ok) {
      throw new Error('Failed to create recipe');
    }

    const { recipe } = await response.json();
    
    // Redirect based on status
    if (recipe.status === 'draft') {
      router.push('/dashboard'); // Drafts are shown in dashboard
    } else {
      router.push(`/recipe/${encodeURIComponent(recipe.title)}/${recipe.cookingTime}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-center min-h-[60vh] flex-col gap-4">
        <h2 className="text-2xl font-bold text-gray-100">Please log in to create a recipe</h2>
        <a href="/api/auth/login" className="btn-cyber">
          Log In
        </a>
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="page-title">Create a New Recipe</h1>
            <p className="text-gray-400">Share your culinary masterpiece with the world</p>
          </div>
          
          <div className="card-cyber p-8">
            <RecipeForm onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}
