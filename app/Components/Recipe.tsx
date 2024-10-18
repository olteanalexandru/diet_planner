import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Comment } from './Comment';
import { Recipe as RecipeType, Comment as CommentType } from '../types';

interface RecipeProps {
  recipe: RecipeType;
  onDelete: (recipeId: string) => void;
  onEdit: (recipeId: string, updatedRecipe: RecipeType) => void;
}

export const Recipe: React.FC<RecipeProps> = ({ recipe, onDelete, onEdit }) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);
  const [comments, setComments] = useState<CommentType[]>(recipe.comments || []);

  useEffect(() => {
    setComments(recipe.comments || []);
  }, [recipe]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedRecipe),
      });
      if (response.ok) {
        const updatedRecipe = await response.json();
        onEdit(recipe.id, updatedRecipe);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedRecipe(recipe);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        onDelete(recipe.id);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
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
        const errorData = await response.json();
        console.error('Error deleting comment:', errorData.error);
        
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      

    }
  };

  const handleCommentEdit = async (commentId: string, newContent: string) => {
    console.log('Editing comment:', commentId, newContent);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
      if (response.ok) {
        const { comment: updatedComment } = await response.json();
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId ? updatedComment : comment
          )
        );
      } else {
        const errorData = await response.json();
        console.error('Error editing comment:', errorData.error);
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { ...comment, likes: comment.likes + 1, isLiked: true }
            : comment
        ));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleCommentUnlike = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { ...comment, likes: comment.likes - 1, isLiked: false }
            : comment
        ));
      }
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  };

  return (
    <div className="recipe">
      {isEditing ? (
        <>
          <input
            value={editedRecipe.title}
            onChange={(e) => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
          />
          {/* Add more fields for editing ingredients, instructions, etc. */}
          <button onClick={handleSaveEdit}>Save</button>
          <button onClick={handleCancelEdit}>Cancel</button>
        </>
      ) : (
        <>
          <h2>{recipe.title}</h2>
          {/* Display other recipe details */}
          {user && user.sub === recipe.authorId && (
            <>
              <button onClick={handleEdit}>Edit</button>
              <button onClick={handleDelete}>Delete</button>
            </>
          )}
          {/* Display comments */}
          {comments.map((comment: CommentType) => (
            <Comment
              key={comment.id}
              comment={comment}
              onDelete={handleCommentDelete}
              onEdit={handleCommentEdit}
              onLike={handleCommentLike}
              onUnlike={handleCommentUnlike}
            />
          ))}
        </>
      )}
    </div>
  );
};