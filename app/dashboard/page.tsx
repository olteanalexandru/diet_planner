'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types';
import { RecipeCard } from '../Components/recipes/RecipeCard';
import Link from 'next/link';

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCustomRecipes();
      fetchFavorites();
      fetchFollowCounts();
    }
  }, [user]);

  const fetchCustomRecipes = async () => {
    try {
      const response = await fetch('/api/recipes');
      if (!response.ok) {
        throw new Error('Failed to fetch custom recipes');
      }
      const data = await response.json();
      setCustomRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching custom recipes:', error);
      setError('Failed to load custom recipes');
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await response.json();
      setFavorites(data.favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to load favorites');
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const response = await fetch('/api/followCounts');
      if (!response.ok) {
        throw new Error('Failed to fetch follow counts');
      }
      const data = await response.json();
      setFollowersCount(data.followersCount);
      setFollowingCount(data.followingCount);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
      setError('Failed to load social stats');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view your dashboard.</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1>Welcome, {user.name}!</h1>
      <div className="row mt-4">
        <div className="col-md-6">
          <h2>Your Custom Recipes</h2>
          {customRecipes.length > 0 ? (
            customRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          ) : (
            <p>You haven't created any custom recipes yet.</p>
          )}
          <Link href="/create-recipe" className="btn btn-primary mt-3">Create New Recipe</Link>
        </div>
        <div className="col-md-6">
          <h2>Your Favorites</h2>
          {favorites.length > 0 ? (
            favorites.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          ) : (
            <p>You haven't added any favorites yet.</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <h2>Social Stats</h2>
        <p>Followers: {followersCount}</p>
        <p>Following: {followingCount}</p>
      </div>
    </div>
  );
}