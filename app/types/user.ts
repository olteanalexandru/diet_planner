import { UserProfile } from '@auth0/nextjs-auth0/client';

interface Auth0User extends UserProfile {
  sub: string;
  email?: string;
  name?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  location?: string;
  website?: string;
  specialties: string[];
  dietaryPreferences: string[];
  avatar?: string;
  _count?: {
    recipes: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}
