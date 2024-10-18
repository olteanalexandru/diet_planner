'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../../types';
import { RecipeCard } from '../../Components/RecipeCard';
import { FollowButton } from '../../Components/FollowButton';

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserRecipes();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      setProfile(data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    }
  };

  const fetchUserRecipes = async () => {
    try {
      const response = await fetch(`/api/recipes?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user recipes');
      }
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      setError('Failed to load user recipes');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!profile) return <div>User not found</div>;

  return (
    <div className="container mt-5">
      <h1>{profile.name}'s Profile</h1>
      {currentUser && currentUser.sub !== profile.id && (
        <FollowButton userId={profile.id} />
      )}
      <h2 className="mt-4">Recipes by {profile.name}</h2>
      {recipes.length > 0 ? (
        recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))
      ) : (
        <p>{profile.name} hasn't created any recipes yet.</p>
      )}
    </div>
  );
}