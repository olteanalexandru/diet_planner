'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../../../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { FavouriteRecipeComponent } from '../../../Components/Favorites';
import { RecipeSkeleton } from './RecipeSkeleton';
import { FollowButton } from '../../../Components/FollowButton';
import { useFavorites } from '../../../context/FavoritesContext';
import { Heart } from 'react-feather';


interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}


export default function RecipeDetails() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const {title, cookingTime } = useParams() as { title: string; cookingTime: string };
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useUser();
  const [favorites, setFavorites] = useLocalStorage<Recipe[]>(
    'favorites',
    []
  ) as [Recipe[], React.Dispatch<React.SetStateAction<Recipe[]>>];
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const handleToggleFavorite = async () => {
    if (!recipe) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorite(recipe)) {
        await removeFavorite(recipe);
      } else {
        await addFavorite(recipe);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  useEffect(() => {
    if (title && cookingTime) {
      const decodedTitle = decodeURIComponent(title);
      const normalizedCookingTime = normalizeCookingTime(cookingTime);

      const fav = favorites.find(
        (fav) =>
          fav.title === decodedTitle &&
          fav.cookingTime && fav.cookingTime == normalizedCookingTime && fav.instructions?.length > 0 && fav.ingredients?.length > 0
      );

      if (fav !== undefined) {
        setRecipe(fav);
        setLoading(false);
        console.log('Recipe found in favorites:', fav);
      } else {
        console.log('Recipe not found in favorites or not fully cached, fetching details...');
        
        fetchRecipeDetails(title, cookingTime, decodedTitle, normalizedCookingTime);
        
      }
    }
  }, [title, cookingTime, favorites]);

  const normalizeCookingTime = (time: string) => time?.replace(/\D/g, '');




  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?recipeId=${recipe?.id}`);
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };


  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipe) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id, content: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };


  useEffect(() => {
    if (recipe) {
      fetchComments();
    }
  }, [recipe]);


  const cacheRestOfRecipe = (recipe : Recipe) => {
    console.log("Checking if recipe is already in favorites" )



    if(!favorites.some((fav) =>  fav.instructions )  && favorites.some((fav) => fav.title == decodeURIComponent(title) && fav.cookingTime == cookingTime  ) ){
    if (recipe) {
        console.log("Caching rest of recipe")
     //add rest of elements to cache instead of appending new recipe
    setFavorites([...favorites.filter((fav) => fav.title !== decodeURIComponent(title) && fav.cookingTime !== cookingTime), { ...recipe }]);
    } 
} 
}

  const fetchRecipeDetails = async (title: string, cookingTime: string, decodedTitle: string, normalizedCookingTime: string) => {
    setLoading(true);
    try {
      // Fetch recipe details if not in favorites
      const response = await fetch('/api/getRecipeDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, cookingTime }),
      });
      const data = await response.json();


const fav = favorites.find(
  (fav) =>
    fav.title === decodedTitle &&
    fav.cookingTime && fav.cookingTime == normalizedCookingTime 
);
console.log("Old id", fav?.id)
data.recipe.id = fav?.id || data.recipe.id;
      setRecipe(data.recipe);
      cacheRestOfRecipe(data.recipe);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
    } finally {
      setLoading(false);
      
    }
  };

if (loading) return <RecipeSkeleton />;
  if (!recipe) return <div className="container mt-5">Recipe not found</div>;
  return (
    <div className="container mt-5">
    <div className="row">
      <div className="col-md-6">
        <img src={recipe.imageUrlLarge} alt="Recipe" className="img-fluid mb-4" style={{ width: '20rem', height: 'auto' }} />
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="mb-0">{recipe.title}</h1>
          <button
            className="btn btn-link"
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
          >
            {isTogglingFavorite ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <Heart size={24} color="#65558F" fill={isFavorite(recipe) ? '#65558F' : 'none'} />
            )}
          </button>
        </div>
        <p className="text-muted">{recipe.cookingTime} mins</p>
      </div>
        <div className="col-md-6">
        
          <h2 className="mt-4">Ingredients:</h2>
          <ul className="list-unstyled">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
          <h2 className="mt-4">Instructions:</h2>
          <ol>
            {recipe.instructions.map((step, index) => (
              <li key={index} className="mb-2">{step}</li>
            ))}
          </ol>
        </div>
      </div>
      <div className="mt-5">
        <h3>Comments</h3>
        {comments.map((comment) => (
          <div key={comment.id} className="mb-3">
            <strong>{comment.user.name}</strong>
            <p>{comment.content}</p>
            <small className="text-muted">{new Date(comment.createdAt).toLocaleString()}</small>
          </div>
        ))}
        {user && (
          <form onSubmit={handleCommentSubmit}>
            <div className="mb-3">
              <label htmlFor="comment" className="form-label">Add a comment</label>
              <textarea
                className="form-control"
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Submit Comment</button>
          </form>
        )}
      </div>
      
      {recipe.author && (
        <div className="mt-4">
          <h4>Recipe by: {recipe.author.name}</h4>
          <FollowButton userId={recipe.author.id} initialIsFollowing={false} />
        </div>
      )}
    
    </div>
  );
}



