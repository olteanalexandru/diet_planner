import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Reply, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

interface ActivityCommentsProps {
  activityId: string;
  onClose: () => void;
}

export const ActivityComments: React.FC<ActivityCommentsProps> = ({
  activityId,
  onClose,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments(1);
  }, [activityId]);

  const fetchComments = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/socialFeed/${activityId}/comment?page=${pageNum}`
      );
      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data = await response.json();
      setComments(prev => pageNum === 1 ? data.comments : [...prev, ...data.comments]);
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/socialFeed/${activityId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const { comment } = await response.json();
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to like comment');

      const { likes } = await response.json();
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                likes,
                isLiked: !comment.isLiked,
              }
            : comment
        )
      );
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  return (
    <div className="card-cyber p-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Comments</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-300 p-2 hover:bg-space-700 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          className="form-textarea w-full mb-2 bg-space-800 border border-space-700 rounded-lg p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyber-primary focus:border-transparent"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          disabled={submitting}
        />
        <button 
          type="submit" 
          className="btn-cyber w-full flex items-center justify-center gap-2"
          disabled={submitting || !newComment.trim()}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Posting...
            </>
          ) : (
            'Post Comment'
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-space-700 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-3 w-full">
                {comment.user.avatar && (
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <span className="font-medium text-gray-300">
                    {comment.user.name}
                  </span>
                  <p className="text-gray-400 mt-1">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <button 
                      onClick={() => handleLike(comment.id)}
                      className={`flex items-center gap-1 transition-colors ${
                        comment.isLiked 
                          ? 'text-cyber-primary' 
                          : 'hover:text-cyber-primary'
                      }`}
                    >
                      <Heart 
                        size={14} 
                        className={comment.isLiked ? 'fill-current' : ''} 
                      /> 
                      {comment.likes}
                    </button>
                    <button className="flex items-center gap-1 hover:text-cyber-primary transition-colors">
                      <Reply size={14} /> Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {hasMore && (
          <button
            onClick={() => fetchComments(page + 1)}
            disabled={loading}
            className="w-full py-2 text-center text-gray-400 hover:text-gray-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading comments...
              </>
            ) : (
              'Load more comments'
            )}
          </button>
        )}

        {!loading && comments.length === 0 && (
          <p className="text-center text-gray-400">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};
