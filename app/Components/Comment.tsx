import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';



let LikeButton: React.FC<{ onClick: () => void; liked: boolean; likes: number }> = ({ onClick, liked, likes }) => {
    return (
        <button onClick={onClick}>
        {liked ? 'Unlike' : 'Like'} ({likes})
        </button>
    );
    }

    

interface CommentProps {
  comment: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
    };
    likes: number;
    isLiked: boolean;
  };
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
}

export const Comment: React.FC<CommentProps> = ({ comment, onDelete, onEdit }) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/comments/${comment.id}/like`, {
        method: comment.isLiked ? 'DELETE' : 'POST',
      });
      if (response.ok) {
        // Update the comment's like status and count in the parent component
      }
    } catch (error) {
      console.error('Error liking/unliking comment:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEdit(comment.id, editedContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className="comment">
      {isEditing ? (
        <>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <button onClick={handleSaveEdit}>Save</button>
          <button onClick={handleCancelEdit}>Cancel</button>
        </>
      ) : (
        <>
          <p>{comment.content}</p>
          <p>By: {comment.user.name}</p>
          <LikeButton
            onClick={handleLike}
            liked={comment.isLiked}
            likes={comment.likes}
          />
          {user && user.sub === comment.user.id && (
            <>
              <button onClick={handleEdit}>Edit</button>
              <button onClick={() => onDelete(comment.id)}>Delete</button>
            </>
          )}
        </>
      )}
    </div>
  );
};