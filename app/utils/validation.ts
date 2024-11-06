import { Recipe, User, Comment } from '../types';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateRecipe = (recipe: Partial<Recipe>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!recipe.title?.trim()) {
    errors.push('Title is required');
  } else if (recipe.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  if (!recipe.ingredients?.length) {
    errors.push('At least one ingredient is required');
  } else {
    recipe.ingredients.forEach((ingredient, index) => {
      if (!ingredient.trim()) {
        errors.push(`Ingredient ${index + 1} cannot be empty`);
      }
    });
  }

  if (!recipe.instructions?.length) {
    errors.push('At least one instruction is required');
  } else {
    recipe.instructions.forEach((instruction, index) => {
      if (!instruction.trim()) {
        errors.push(`Instruction ${index + 1} cannot be empty`);
      }
    });
  }

  if (!recipe.cookingTime || recipe.cookingTime < 1) {
    errors.push('Cooking time must be at least 1 minute');
  }

  if (!recipe.servings || recipe.servings < 1) {
    errors.push('Number of servings must be at least 1');
  }

  if (recipe.description && recipe.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUserProfile = (user: Partial<User>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!user.name?.trim()) {
    errors.push('Name is required');
  } else if (user.name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }

  if (user.bio && user.bio.length > 500) {
    errors.push('Bio must be less than 500 characters');
  }

  if (user.website) {
    try {
      new URL(user.website);
    } catch {
      errors.push('Website must be a valid URL');
    }
  }

  if (user.location && user.location.length > 100) {
    errors.push('Location must be less than 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateComment = (content: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!content.trim()) {
    errors.push('Comment cannot be empty');
  } else if (content.length > 1000) {
    errors.push('Comment must be less than 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const validateFileUpload = (file: File, maxSize: number = 5 * 1024 * 1024): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.floor(maxSize / 1024 / 1024)}MB`);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('File must be a JPEG, PNG, or WebP image');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateTags = (tags: string[]): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (tags.length > 10) {
    errors.push('Maximum of 10 tags allowed');
  }

  tags.forEach((tag, index) => {
    if (!tag.trim()) {
      errors.push(`Tag ${index + 1} cannot be empty`);
    } else if (tag.length > 20) {
      errors.push(`Tag ${index + 1} must be less than 20 characters`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
