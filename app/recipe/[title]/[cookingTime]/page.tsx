'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe, Comment } from '../../../types';
import { RecipeSkeleton } from './RecipeSkeleton';
import { FollowButton } from '../../../Components/FollowButton';
import { Heart } from 'lucide-react';
import { useFavorites } from '../../../context/FavoritesContext';
import { useRecipes } from '../../../context/RecipeContext';
import { useComments } from '../../../context/CommentContext';

export default function RecipeDetails() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(null);
  const { title, cookingTime } = useParams() as { title: string; cookingTime: string };
  const [newComment, setNewComment] = useState('');
  const { user } = useUser();
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { loading, error, fetchRecipeDetails } = useRecipes();
  const { comments, addComment, editComment, deleteComment, likeComment, unlikeComment } = useComments();

  useEffect(() => {
    if (title && cookingTime) {
      fetchRecipeDetails(title, cookingTime).then(fetchedRecipe => {
        if (fetchedRecipe) {
          setRecipe(fetchedRecipe);
          setEditedRecipe(fetchedRecipe);
        }
      });
    }
  }, [title, cookingTime, fetchRecipeDetails]);

  const toggleFavorite = async () => {
    if (!recipe) return;
    try {
      if (isFavorite(recipe)) {
        await removeFavorite(recipe);
      } else {
        await addFavorite(recipe);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedRecipe(recipe);
  };

  const handleSaveEdit = async () => {
    if (!editedRecipe) return;
    try {
      const response = await fetch(`/api/recipes/${recipe?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedRecipe),
      });
      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  const handleRecipeDelete = async () => {
    if (!recipe) return;
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipe) return;
    await addComment(recipe.id, newComment);
    setNewComment('');
  };

  if (loading) return <RecipeSkeleton />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!recipe) return <div className="container mt-5">Recipe not found</div>;

  return (
    <div className="container mt-5">
      {isEditing ? (
        <div>
          <h1>Edit Recipe</h1>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                id="title"
                value={editedRecipe?.title || ''}
                onChange={(e) => setEditedRecipe(prev => prev ? {...prev, title: e.target.value} : null)}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="cookingTime" className="form-label">Cooking Time (minutes)</label>
              <input
                type="number"
                className="form-control"
                id="cookingTime"
                value={editedRecipe?.cookingTime || ''}
                onChange={(e) => setEditedRecipe(prev => prev ? {...prev, cookingTime: e.target.value} : null)}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="ingredients" className="form-label">Ingredients</label>
              <textarea
                className="form-control"
                id="ingredients"
                value={editedRecipe?.ingredients.join('\n') || ''}
                onChange={(e) => setEditedRecipe(prev => prev ? {...prev, ingredients: e.target.value.split('\n')} : null)}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="instructions" className="form-label">Instructions</label>
              <textarea
                className="form-control"
                id="instructions"
                value={editedRecipe?.instructions.join('\n') || ''}
                onChange={(e) => setEditedRecipe(prev => prev ? {...prev, instructions: e.target.value.split('\n')} : null)}
              />
            </div>
            <button type="submit" className="btn btn-primary me-2">Save Changes</button>
            <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
          </form>
        </div>
      ) : (
        <div>
          <div className="row">
            <div className="col-md-6">
              <img src={recipe.imageUrlLarge} alt={recipe.title} className="img-fluid mb-4" style={{ width: '20rem', height: 'auto' }} />
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="mb-0">{recipe.title}</h1>
                <button
                  className="btn btn-link"
                  onClick={toggleFavorite}
                >
                  <Heart size={24} color="#65558F" fill={isFavorite(recipe) ? '#65558F' : 'none'} />
                </button>
              </div>
              <p className="text-muted">{recipe.cookingTime} mins</p>
              {user && user.sub === recipe.authorId && (
                <div>
                  <button className="btn btn-primary me-2" onClick={handleEdit}>Edit</button>
                  <button className="btn btn-danger" onClick={handleRecipeDelete}>Delete</button>
                </div>
              )}
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
            {comments.map((comment: Comment) => (
              <div key={comment.id} className="mb-3">
                <strong>{comment.user.name}</strong>
                <p>{comment.content}</p>
                <small className="text-muted">{new Date(comment.createdAt).toLocaleString()}</small>
                <button 
                  className="btn btn-sm btn-outline-primary ms-2" 
                  onClick={() => comment.isLiked ? unlikeComment(comment.id) : likeComment(comment.id)}
                >
                  <Heart size={16} fill={comment.isLiked ? '#007bff' : 'none'} /> {comment.likes}
                </button>
                {user && user.sub === comment.userId && (
                  <>
                    <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => editComment(comment.id, comment.content)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => deleteComment(comment.id)}>Delete</button>
                  </>
                )}
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
              <FollowButton userId={recipe.author.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}