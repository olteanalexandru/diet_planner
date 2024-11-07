export interface Recipe {
  id: string;
  title: string;
  // ... other fields ...
  isLiked?: boolean;
  _count?: {
    likes: number;
    comments: number;
    favorites: number;
  };
}
