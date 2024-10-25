import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Reply } from 'lucide-react';
import { useEffect } from 'react';


interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [activityId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/socialFeed/${activityId}/comment?page=${page}`
      );
      const data = await response.json();
      setComments(prev => [...prev, ...data.comments]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/socialFeed/${activityId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      const { comment } = await response.json();
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  return (
    <div className="card-cyber p-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Comments</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          className="form-textarea w-full mb-2"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <button type="submit" className="btn-cyber w-full">
          Post Comment
        </button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-space-700 pb-4">
            <div className="flex justify-between items-start">
              <div>
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
                  <button className="flex items-center gap-1 hover:text-cyber-primary">
                    <Heart size={14} /> {comment.likes}
                  </button>
                  <button className="flex items-center gap-1 hover:text-cyber-primary">
                    <Reply size={14} /> Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {hasMore && (
          <button
            onClick={() => {
              setPage(prev => prev + 1);
              fetchComments();
            }}
            disabled={loading}
            className="w-full py-2 text-center text-gray-400 hover:text-gray-300"
          >
            {loading ? 'Loading...' : 'Load more comments'}
          </button>
        )}
      </div>
    </div>
  );
};