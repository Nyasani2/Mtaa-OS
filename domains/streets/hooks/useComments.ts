import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../services/commentService';
import type { CommentInput, ReplyInput } from '../types';

export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const addComment = useMutation({
    mutationFn: (input: CommentInput) => commentService.addComment(postId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'comments', postId] });
      setCommentText('');
    },
  });

  const addReply = useMutation({
    mutationFn: ({ commentId, input }: { commentId: string; input: ReplyInput }) =>
      commentService.addReply(commentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'comments', postId] });
      setReplyingTo(null);
      setCommentText('');
    },
  });

  const likeComment = useMutation({
    mutationFn: (commentId: string) => commentService.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'comments', postId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'comments', postId] });
    },
  });

  const startReply = useCallback((commentId: string) => {
    setReplyingTo(commentId);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
    setCommentText('');
  }, []);

  return {
    commentText,
    setCommentText,
    replyingTo,
    addComment,
    addReply,
    likeComment,
    deleteComment,
    startReply,
    cancelReply,
  };
}
