// import { useState, useCallback } from 'react';
// import { Comment } from '../types';
// import { commentService } from '../services/commentService';

// export const useComments = (recipeId?: string) => {
//   const [comments, setComments] = useState<Comment[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchComments = useCallback(async (rid: string) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await commentService.getComments(rid);
//       if (response.error) {
//         throw new Error(response.error);
//       }
//       if (response.data?.comments) {
//         setComments(response.data.comments);
//         return response.data.comments;
//       }
//       return [];
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch comments');
//       return [];
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const addComment = useCallback(async (rid: string, content: string) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await commentService.addComment(rid, content);
//       if (response.error) {
//         throw new Error(response.error);
//       }
//       if (response.data?.comment) {
//         setComments(prev => [response.data!.comment, ...prev]);
//         return response.data.comment;
//       }
//       return null;
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to add comment');
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const updateComment = useCallback(async (commentId: string, content: string) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await commentService.updateComment(commentId, content);
//       if (response.error) {
//         throw new Error(response.error);
//       }
//       if (response.data?.comment) {
//         setComments(prev => 
//           prev.map(comment => 
//             comment.id === commentId ? response.data!.comment : comment
//           )
//         );
//         return response.data.comment;
//       }
//       return null;
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to update comment');
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const deleteComment = useCallback(async (commentId: string) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await commentService.deleteComment(commentId);
//       if (response.error) {
//         throw new Error(response.error);
//       }
//       setComments(prev => prev.filter(comment => comment.id !== commentId));
//       return true;
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to delete comment');
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const toggleLike = useCallback(async (commentId: string, isLiked: boolean) => {
//     setError(null);
//     try {
//       const response = isLiked
//         ? await commentService.unlikeComment(commentId)
//         : await commentService.likeComment(commentId);
      
//       if (response.error) {
//         throw new Error(response.error);
//       }

//       setComments(prev => 
//         prev.map(comment => {
//           if (comment.id === commentId) {
//             return {
//               ...comment,
//               likes: isLiked ? comment.likes - 1 : comment.likes + 1,
//               isLiked: !isLiked,
//             };
//           }
//           return comment;
//         })
//       );
//       return true;
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to toggle like');
//       return false;
//     }
//   }, []);

//   // If recipeId is provided, fetch comments on mount
//   useState(() => {
//     if (recipeId) {
//       fetchComments(recipeId);
//     }
//   });

//   return {
//     comments,
//     loading,
//     error,
//     fetchComments,
//     addComment,
//     updateComment,
//     deleteComment,
//     toggleLike,
//   };
// };
