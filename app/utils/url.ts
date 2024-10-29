import { Recipe } from '../types';

/**
 * Cleans and normalizes a recipe title for URLs
 */
export const cleanTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single hyphen
    .trim();
};

/**
 * Creates a consistent recipe URL
 */
export const createRecipeUrl = (recipe: Recipe): string => {
  if (!recipe) return '/recipes';

  // For timestamp-based IDs
  if (recipe.id.match(/^\d{13}/)) {
    const title = cleanTitle(recipe.title);
    return `/recipe/${recipe.id}-${title}`;
  }

  // For database IDs
  return `/recipe/${encodeURIComponent(recipe.id)}`;
};

/**
 * Parses a recipe URL to extract parameters
 */
export const parseRecipeUrl = (url: string): {
  timestamp?: string;
  title?: string;
  id?: string;
} => {
  // Check for timestamp format
  const timestampMatch = url.match(/^(\d{13})-(.+?)(?:\/edit|$|\?|&)/);
  if (timestampMatch) {
    return {
      timestamp: timestampMatch[1],
      title: decodeURIComponent(timestampMatch[2]).replace(/-/g, ' ')
    };
  }

  // Treat as database ID
  return {
    id: url.split('/')[0].split('?')[0]
  };
};

/**
 * Creates a shareable URL for the recipe
 */
export const createShareUrl = (recipe: Recipe): string => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || '';
  
  return `${baseUrl}${createRecipeUrl(recipe)}`;
};

/**
 * Creates a user profile URL
 */
export const createUserUrl = (userId: string): string => {
  if (!userId) return '/';
  return `/profile/${encodeURIComponent(userId)}`;
};