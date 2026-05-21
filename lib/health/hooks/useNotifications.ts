'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../services/notification.service';
import { useEffect } from 'react';

export function useNotifications(userId: string) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['health', 'notifications', userId], queryFn: () => NotificationService.getNotifications(userId), enabled: !!userId });
  useEffect(() => {
    if (!userId) return;
    const sub = NotificationService.subscribeToNotifications(userId, () => qc.invalidateQueries({ queryKey: ['health', 'notifications', userId] }));
    return () => { sub.unsubscribe(); };
  }, [userId, qc]);
  return query;
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: NotificationService.markAsRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['health', 'notifications'] }) });
}
