
import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Heart, Clock, Share2, ChefHat, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import { Recipe } from '@/app/types';
import { Comment } from '../Comment';
import { useFavorites } from '@/app/context/FavoritesContext';
import { useComments } from '@/app/context/CommentContext';
import { createUserUrl, createShareUrl } from '@/app/utils/url';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FollowButton } from '../FollowButton';

interface RecipeDetailProps {
  recipe: Recipe;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe }) => {
  const { user } = useUser();
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [isLiked, setIsLiked] = useState(() => isFavorite(recipe));
  const [newComment, setNewComment] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const MAX_COMMENT_LENGTH = 500;

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

  const handleLike = async () => {
    if (!user) {
      router.push('/api/auth/login');
      return;
    }

    try {
      if (isLiked) {
        await removeFavorite(recipe);
      } else {
        await addFavorite(recipe);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: recipe.title,
        text: `Check out this recipe: ${recipe.title}`,
        url: createShareUrl(recipe)
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/recipes');
      } else {
        throw new Error('Failed to delete recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe');
    } finally {
      setIsDeleting(false);
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
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Recipe Header */}
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
                    onClick={handleLike}
                    className="btn-cyber-outline p-2"
                    aria-label={isLiked ? 'Unlike recipe' : 'Like recipe'}
                  >
                    <Heart
                      size={20}
                      className={isLiked ? 'fill-cyber-primary text-cyber-primary' : ''}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="btn-cyber-outline p-2"
                    aria-label="Share recipe"
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

            {/* Owner Actions */}
            {recipe.isOwner && (
              <div className="flex gap-4">
                <Link
                  href={`/recipes/${recipe.id}/edit`}
                  className="btn-cyber-outline flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit Recipe
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn-cyber-outline flex items-center gap-2 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  {isDeleting ? 'Deleting...' : 'Delete Recipe'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ingredients */}
        <div className="card-cyber p-6">
          <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
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
            {recipe.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-4 text-gray-300">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyber-primary/10 flex items-center justify-center text-cyber-primary font-medium">
                  {index + 1}
                </span>
                <p>{instruction}</p>
              </li>
            ))}
          </ol>
        </div>

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
    </div>
  );
};