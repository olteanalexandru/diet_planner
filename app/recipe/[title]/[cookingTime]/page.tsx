'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../../../types';
import { FollowButton } from '../../../Components/FollowButton';
import { Heart, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useFavorites } from '../../../context/FavoritesContext';
import { useRecipes } from '../../../context/RecipeContext';
import { useComments } from '../../../context/CommentContext';
import { Comment } from '../../../Components/Comment';

const MAX_COMMENTS = 5;
const MAX_COMMENT_LENGTH = 500;

export default function RecipeDetails() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(null);
  const [newComment, setNewComment] = useState('');
  const { title, cookingTime } = useParams() as { title: string; cookingTime: string };
  const { user } = useUser();
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { loading: recipeLoading, error: recipeError, fetchRecipeDetails } = useRecipes();
  const { 
    comments, 
    isLoading: commentsLoading, 
    error: commentsError,
    fetchComments,
    addComment,
    editComment,
    deleteComment,
    likeComment,
    unlikeComment
  } = useComments();

  useEffect(() => {
    const loadRecipeAndComments = async () => {
      if (title && cookingTime) {
        const fetchedRecipe = await fetchRecipeDetails(title, cookingTime);
        if (fetchedRecipe) {
          setRecipe(fetchedRecipe);
          setEditedRecipe(fetchedRecipe);
          await fetchComments(fetchedRecipe.id);
        }
      }
    };
    loadRecipeAndComments();
  }, [title, cookingTime, fetchRecipeDetails, fetchComments]);

  const toggleFavorite = async () => {
    if (!recipe || !user) return;
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
    if (!recipe || !window.confirm('Are you sure you want to delete this recipe?')) return;
    
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
    if (!user || !recipe || !newComment.trim()) return;
    
    if (newComment.length > MAX_COMMENT_LENGTH) {
      alert(`Comment is too long. Maximum length is ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }
    
    if (comments.length >= MAX_COMMENTS) {
      alert(`Maximum number of comments (${MAX_COMMENTS}) reached.`);
      return;
    }

    try {
      await addComment(recipe.id, newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  if (recipeLoading) {
    return (
      <div className="flex-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    );
  }
  
  if (recipeError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="alert-error p-4 rounded-lg">
          {recipeError}
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="alert-error p-4 rounded-lg">
          Recipe not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Recipe Header Section */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Image Container */}
          <div className="w-full md:w-1/2 lg:w-2/5">
            <div className="card-cyber p-4 h-full">
              <img 
                src={recipe.imageUrlLarge || '/placeholder.jpg'} 
                alt={recipe.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Recipe Info Container */}
          <div className="w-full md:w-1/2 lg:w-3/5 space-y-6">
            <div className="card-cyber p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-100">{recipe.title}</h1>
                  <p className="text-gray-400 mt-2">{recipe.cookingTime} minutes</p>
                </div>
                {user && (
                  <button
                    onClick={toggleFavorite}
                    className="p-2 rounded-lg hover:bg-space-700 transition-colors duration-200"
                    title={isFavorite(recipe) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart 
                      size={24} 
                      className="text-cyber-primary"
                      fill={isFavorite(recipe) ? 'currentColor' : 'none'} 
                    />
                  </button>
                )}
              </div>

              {user && user.sub === recipe.authorId && (
                <div className="flex gap-4 mt-6">
                  <button 
                    className="btn-cyber-outline flex items-center gap-2" 
                    onClick={handleEdit}
                  >
                    <Edit2 size={16} />
                    Edit Recipe
                  </button>
                  <button 
                    className="btn-cyber-outline flex items-center gap-2 text-red-500 hover:bg-red-500/10" 
                    onClick={handleRecipeDelete}
                  >
                    <Trash2 size={16} />
                    Delete Recipe
                  </button>
                </div>
              )}
            </div>

            {/* Ingredients */}
            <div className="card-cyber p-6">
              <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-gray-300">
                    • {ingredient}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="card-cyber p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="space-y-4">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="text-gray-300">
                <span className="font-semibold text-cyber-primary mr-2">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Comments Section */}
        <div className="card-cyber p-6">
          {user ? (
            <>
              <h3 className="text-xl font-semibold mb-4">
                Comments ({comments.length}/{MAX_COMMENTS})
              </h3>
              
              {commentsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-cyber-primary" />
                </div>
              ) : (
                <>
                  {comments.map((comment) => (
                    <Comment
                      key={comment.id}
                      comment={comment}
                      onDelete={deleteComment}
                      onEdit={editComment}
                      onLike={likeComment}
                      onUnlike={unlikeComment}
                    />
                  ))}
                </>
              )}

              {comments.length < MAX_COMMENTS && (
                <form onSubmit={handleCommentSubmit} className="mt-6">
                  <div className="space-y-2">
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-300">
                      Add a comment
                    </label>
                    <textarea
                      id="comment"
                      className="form-textarea w-full"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      maxLength={MAX_COMMENT_LENGTH}
                      required
                    />
                    <div className="text-sm text-gray-400">
                      {newComment.length}/{MAX_COMMENT_LENGTH} characters
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="btn-cyber mt-4"
                    disabled={commentsLoading}
                  >
                    {commentsLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Comment'
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <h3 className="text-xl font-semibold mb-2">Comments</h3>
              <p className="text-gray-400 mb-4">Sign in to view and post comments</p>
              <a href="/api/auth/login" className="btn-cyber">
                Sign In
              </a>
            </div>
          )}

          {commentsError && (
            <div className="alert-error mt-4 p-4 rounded-lg">
              {commentsError}
            </div>
          )}
        </div>
        
        {/* Author Section */}
        {recipe.author && (
          <div className="card-cyber p-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Recipe by: {recipe.author.name}</h4>
              {user && user.sub !== recipe.author.id && (
                <FollowButton userId={recipe.author.id} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}