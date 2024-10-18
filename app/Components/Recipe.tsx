import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Comment } from './Comment';
import { Recipe as RecipeType } from '../types';

interface RecipeProps {
  recipe: RecipeType;
  onDelete: (recipeId: string) => void;
  onEdit: (recipeId: string, updatedRecipe: RecipeType) => void;
}

export const Recipe: React.FC<RecipeProps> = ({ recipe, onDelete, onEdit }) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);

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

  return (
    <div className="recipe">
      {isEditing ? (
        <>
          <input
            value={editedRecipe.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
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
        </>
      )}
      {/* Display comments */}
      {recipe.comments && recipe.comments.map((comment: { id: any; content?: string; user?: { id: string; name: string; }; likes?: number; isLiked?: boolean; }) => (
        comment.content && comment.user && comment.likes !== undefined && comment.isLiked !== undefined && (
          <Comment
            key={comment.id}
            comment={{
              id: comment.id,
              content: comment.content,
              user: comment.user,
              likes: comment.likes,
              isLiked: comment.isLiked
            }}
            onDelete={(commentId: string) => {/* Implement comment delete */}}
            onEdit={(commentId: string, newContent: string) => {/* Implement comment edit */}}
          />
        )
      ))}
    </div>
  );
};