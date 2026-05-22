import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<any>(null);

  return {
    notifications,
    preferences,
    setPreferences,
    markAsRead: (id: string) => {},
    deleteNotification: (id: string) => {},
  };
}
