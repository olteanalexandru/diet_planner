'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { RecipeForm } from '../Components/RecipeForm';

export default function CreateRecipe() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to create a recipe.</div>;

  return (
    <div className="container mt-5">
      <h1>Create a New Recipe</h1>
      <RecipeForm />
    </div>
  );
}