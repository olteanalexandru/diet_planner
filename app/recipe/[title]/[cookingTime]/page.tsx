'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe, Comment } from '../../../types';
import { RecipeSkeleton } from './RecipeSkeleton';
import { FollowButton } from '../../../Components/FollowButton';
import { Heart } from 'lucide-react';

export default function RecipeDetails() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(null);
  const { title, cookingTime } = useParams() as { title: string; cookingTime: string };
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (title && cookingTime) {
      fetchRecipeDetails(title, cookingTime);
    }
  }, [title, cookingTime]);

  const fetchRecipeDetails = async (title: string, cookingTime: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/getRecipeDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, cookingTime }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }
      const data = await response.json();
      setRecipe(data.recipe);
      setEditedRecipe(data.recipe);
      setComments(data.recipe.comments || []); // Ensure comments is always an array
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setError('Failed to load recipe details');
    } finally {
      setLoading(false);
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
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recipes/${recipe?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedRecipe),
      });
      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }
      const data = await response.json();
      setRecipe(data.recipe);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating recipe:', error);
      setError('Failed to update recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeDelete = async () => {
    if (!recipe) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }
      router.push('/');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setError('Failed to delete recipe');
    } finally {
      setLoading(false);
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
        setComments(prevComments => [...prevComments, data.comment]);
        setNewComment('');
      } else {
        throw new Error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError('Failed to submit comment');
    }
  };

  const handleCommentEdit = async (commentId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments(prevComments => prevComments.map(comment => 
          comment.id === commentId ? updatedComment.comment : comment
        ));
      } else {
        throw new Error('Failed to edit comment');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      setError('Failed to edit comment');
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        setComments(prevComments => prevComments.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes + 1, isLiked: true } 
            : comment
        ));
      } else {
        throw new Error('Failed to like comment');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      setError('Failed to like comment');
    }
  };

  const handleUnlikeComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(prevComments => prevComments.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes - 1, isLiked: false } 
            : comment
        ));
      } else {
        throw new Error('Failed to unlike comment');
      }
    } catch (error) {
      console.error('Error unliking comment:', error);
      setError('Failed to unlike comment');
    }
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
                {user && user.sub === recipe.authorId && (
                  <div>
                    <button className="btn btn-primary me-2" onClick={handleEdit}>Edit</button>
                    <button className="btn btn-danger" onClick={handleRecipeDelete}>Delete</button>
                  </div>
                )}
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
                <button 
                  className="btn btn-sm btn-outline-primary ms-2" 
                  onClick={() => comment.isLiked ? handleUnlikeComment(comment.id) : handleLikeComment(comment.id)}
                >
                  <Heart size={16} fill={comment.isLiked ? '#007bff' : 'none'} /> {comment.likes}
                </button>
                {user && user.sub === comment.userId && (
                  <>
                    <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => handleCommentEdit(comment.id, comment.content)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => handleCommentDelete(comment.id)}>Delete</button>
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