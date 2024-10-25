export const createSlug = (text: string): string => {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace special chars with hyphens
      .replace(/-+/g, '-')         // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
      .trim();
  };
  
  export const createRecipeUrl = (recipe: { title: string; id: string }): string => {
    const slug = createSlug(recipe.title);
    return `/recipe/${slug}/${recipe.id}`;
  };
  
  export const createUserUrl = (userId: string): string => {
    return `/profile/${encodeURIComponent(userId)}`;
  };
  
  export const createTagUrl = (tag: string): string => {
    return `/recipes/tag/${createSlug(tag)}`;
  };
  
  export const createShareUrl = (recipe: { title: string; id: string }): string => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}${createRecipeUrl(recipe)}`;
  };