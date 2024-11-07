import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { Heart, Clock, Share2, ChefHat, Edit2, Save, Loader2, MessageCircle, PenTool, Bookmark } from 'lucide-react';
import { Recipe, Comment as CommentType } from '../../types';
import Link from 'next/link';
import { Comment } from '../Comment';
import { useFavorites } from '../../context/FavoritesContext';
import { useComments } from '../../context/CommentContext';
import { useRecipes } from '../../context/RecipeContext';
import { createUserUrl, createShareUrl } from '../../utils/url';
import { FollowButton } from '../FollowButton';
import { RecipeEditModal } from './RecipeEditModal';
import { RecipeManagement } from './RecipeManagement';

interface RecipeDetailProps {
  recipe: Recipe;
  isGeneratedRecipe?: boolean;
  onLike?: () => Promise<void>;  // Add this prop
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ 
  recipe: initialRecipe,
  isGeneratedRecipe = false,
  onLike  // Add this prop
 }) => {
  const router = useRouter();
  const { user } = useUser();
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const MAX_COMMENT_LENGTH = 500;

  const [saving, setSaving] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const {
    comments,
    isLoading: commentsLoading,
    error: commentsError,
    addComment,
    editComment,
    deleteComment,
    likeComment,
    unlikeComment
  } = useComments();

  const handleAddAsDraft = async () => {
    if (!user) {
      router.push('/api/auth/login');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const recipeData = {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        cookingTime: recipe.cookingTime,
        imageUrl: recipe.imageUrl,
        imageUrlLarge: recipe.imageUrlLarge,
        category: recipe.category || 'other',
        tags: recipe.tags || [],
        dietaryInfo: recipe.dietaryInfo || {},
        status: 'draft'
      };

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        throw new Error('Failed to save recipe');
      }

      const { recipe: savedRecipe } = await response.json();
      router.push('/dashboard');

    } catch (error) {
      console.error('Error saving recipe:', error);
      setError(error instanceof Error ? error.message : 'Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const recipeData = {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        cookingTime: recipe.cookingTime,
        imageUrl: recipe.imageUrl,
        imageUrlLarge: recipe.imageUrlLarge,
        category: recipe.category || 'other',
        tags: recipe.tags || [],
        dietaryInfo: recipe.dietaryInfo || {},
        status: 'published'
      };

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        throw new Error('Failed to save recipe');
      }

      const { recipe: savedRecipe } = await response.json();
      router.push(`/recipe/${encodeURIComponent(savedRecipe.title)}/${savedRecipe.cookingTime}`);

    } catch (error) {
      console.error('Error saving recipe:', error);
      setError(error instanceof Error ? error.message : 'Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      router.push('/api/auth/login');
      return;
    }

    setIsFavoriting(true);
    try {
      if (isFavorite(recipe)) {
        await removeFavorite(recipe);
      } else {
        await addFavorite(recipe);
      }
      
      setRecipe((prev: Recipe) => ({
        ...prev,
        _count: {
          ...prev._count,
          favorites: isFavorite(recipe) ? 
            (prev._count?.favorites || 1) - 1 : 
            (prev._count?.favorites || 0) + 1
        }
      }));
    } catch (error) {
      setError('Failed to update favorite status');
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleLikeClick = async () => {
    if (!user) {
      router.push('/api/auth/login');
      return;
    }
  
    try {
      if (!recipe.id) return;
  
      const response = await fetch(`/api/recipes/${recipe.id}/like`, {
        method: recipe.isLiked ? 'DELETE' : 'POST',
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        if (response.status === 400 && data.error === 'Already liked') {
          // Handle already liked case by forcing a refresh of like status
          const statusResponse = await fetch(`/api/recipes/${recipe.id}/like/status`);
          if (statusResponse.ok) {
            const { isLiked, likes } = await statusResponse.json();
            setRecipe(prev => ({
              ...prev,
              isLiked,
              _count: { ...prev._count, likes }
            }));
          }
          return;
        }
        throw new Error(data.error || 'Failed to update like status');
      }
  
      setRecipe(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        _count: {
          ...prev._count,
          likes: data.likes
        }
      }));
    } catch (error) {
      console.error('Error updating like:', error);
      setError('Failed to update like status');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: recipe.title,
        text: `Check out this recipe: ${recipe.title}`,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/api/auth/login');
      return;
    }

    if (!newComment.trim()) return;

    try {
      await addComment(recipe.id, newComment.trim());
      setNewComment('');
      setRecipe((prev: Recipe) => ({
        ...prev,
        _count: {
          ...prev._count,
          comments: (prev._count?.comments || 0) + 1
        }
      }));
    } catch (error) {
      setError('Failed to add comment');
    }
  };

  const handleEditSuccess = (updatedRecipe: Recipe) => {
    setRecipe(updatedRecipe);
    setIsEditModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {/* Recipe Header */}
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">{recipe.title}</h1>

          {recipe.isOwner && (
            <div className="flex gap-4">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn-cyber-outline flex items-center gap-2"
              >
                <Edit2 size={16} />
                Edit
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Recipe Info */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Image Container */}
          <div className="w-full md:w-1/2 lg:w-2/5">
            <div className="card-cyber p-4 h-full">
              <img
                src={recipe.imageUrlLarge || recipe.imageUrl || '/placeholder-recipe.jpg'}
                alt={recipe.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Recipe Info */}
          <div className="w-full md:w-1/2 lg:w-3/5 space-y-6">
            <div className="card-cyber p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-100">{recipe.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-400">
                    <Clock size={16} />
                    <span>{recipe.cookingTime} minutes</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleLikeClick}
                    className={`btn-cyber-outline p-2 flex items-center gap-2 ${
                      recipe.isLiked ? 'text-cyber-primary' : ''
                    }`}
                    title={recipe.isLiked ? 'Unlike' : 'Like'}
                  >
                    <Heart
                      size={20}
                      className={recipe.isLiked ? 'fill-current' : ''}
                    />
                    <span>{recipe._count?.likes || 0}</span>
                  </button>
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={isFavoriting}
                    className="btn-cyber-outline p-2"
                    title={isFavorite(recipe) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Bookmark
                      size={20}
                      className={isFavorite(recipe) ? 'fill-cyber-primary text-cyber-primary' : ''}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="btn-cyber-outline p-2"
                    title="Share recipe"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {/* Author Info */}
              {recipe.author && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-space-700">
                  <Link
                    href={createUserUrl(recipe.author.id)}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-cyber-primary/10 flex items-center justify-center">
                      {recipe.author.name?.[0] || <ChefHat size={24} />}
                    </div>
                    <div>
                      <span className="font-medium group-hover:text-cyber-primary transition-colors">
                        {recipe.author.name}
                      </span>
                      <p className="text-sm text-gray-400">Recipe Author</p>
                    </div>
                  </Link>

                  {user && user.sub !== recipe.authorId && (
                    <FollowButton userId={recipe.authorId} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="card-cyber p-6">
          <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient: string, index: number) => (
              <li key={index} className="flex items-center gap-2 text-gray-300">
                <span className="w-2 h-2 rounded-full bg-cyber-primary/50" />
                {ingredient}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="card-cyber p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="space-y-4">
            {recipe.instructions.map((instruction: string, index: number) => (
              <li key={index} className="flex gap-4 text-gray-300">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyber-primary/10 flex items-center justify-center text-cyber-primary font-medium">
                  {index + 1}
                </span>
                <p>{instruction}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Save Button Banner for AI-generated recipes */}
        {isGeneratedRecipe && (
          <div className="card-cyber bg-cyber-primary/5 p-4 flex items-center justify-between">
            <div className="flex-grow">
              <h3 className="text-lg font-medium text-cyber-primary">
                Like this recipe?
              </h3>
              <p className="text-gray-400">
                Add it to your collection and customize it later
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddAsDraft}
                disabled={saving}
                className="btn-cyber flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Add as Draft
                  </>
                )}
              </button>
              <button
                onClick={handleSaveRecipe}
                disabled={saving}
                className="btn-cyber-outline flex items-center gap-2"
              >
                <PenTool size={16} />
                Save & Complete Now
              </button>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="card-cyber p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Comments ({recipe._count?.comments || 0})
            </h2>
            <MessageCircle size={20} className="text-gray-400" />
          </div>

          {user ? (
            <>
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="space-y-2">
                  <textarea
                    className="form-textarea w-full"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={MAX_COMMENT_LENGTH}
                  />
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>
                      {newComment.length}/{MAX_COMMENT_LENGTH} characters
                    </span>
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="btn-cyber px-4 py-2"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>

              {commentsLoading ? (
                <div className="text-center py-4 text-gray-400">
                  Loading comments...
                </div>
              ) : commentsError ? (
                <div className="text-center py-4 text-red-400">
                  {commentsError}
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment: CommentType) => (
                    <Comment
                      key={comment.id}
                      comment={comment}
                      onDelete={deleteComment}
                      onEdit={editComment}
                      onLike={likeComment}
                      onUnlike={unlikeComment}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                Please sign in to leave a comment
              </p>
              <Link href="/api/auth/login" className="btn-cyber">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <RecipeManagement
        recipe={recipe}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Error Notification */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
