export interface Recipe {
  author: any;
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  nutritionInfo?: string;
  cookingTime?: string;
  servingSize?: string;
  imageUrl?: string;
  imageUrlLarge?: string;
}


export interface FavouriteRecipeComponentProps {
  recipe: Recipe;
  favorites: Recipe[];
  setFavorites: React.Dispatch<React.SetStateAction<Recipe[]>>;
}



