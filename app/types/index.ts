

export interface FavouriteRecipeComponentProps {
  recipe: Recipe;
  favorites: Recipe[];
  setFavorites: React.Dispatch<React.SetStateAction<Recipe[]>>;
}



export interface UserProfile extends User {
  _count: {
    recipes: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}





export interface FavouriteRecipeComponentProps {
  recipe: Recipe;
  favorites: Recipe[];
  setFavorites: React.Dispatch<React.SetStateAction<Recipe[]>>;
}



export interface MealPlan {
  id: string;
  date: string;
  recipe: Recipe;
}




export interface User {
  id: string;
  email: string | null;
  name: string | null;
  subscriptionStatus: 'free' | 'premium';
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  imageUrl?: string;
  imageUrlLarge?: string;
  authorId: string;
  author?: User;
  comments?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
  };
  likes: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  recipeId: string;
}

export interface CommentLike {
  id: string;
  userId: string;
  commentId: string;
}

export interface Activity {
  id: string;
  userId: string;
  action: string;
  recipeId?: string;
  commentId?: string;
  createdAt: Date;
}
