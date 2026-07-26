/**
 * MTAA OS V10 — useProfileFriends Hook
 * Friend system: requests, accept, block, unfriend
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchFriends,
  fetchFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  unfriend,
  UserFriendship,
} from '@/lib/services/profile-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useProfileFriends() {
  const [friends, setFriends] = useState<UserFriendship[]>([]);
  const [requests, setRequests] = useState<UserFriendship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [f, r] = await Promise.all([
        fetchFriends(userId),
        fetchFriendRequests(userId),
      ]);
      setFriends(f);
      setRequests(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const sendRequest = useCallback(async (addresseeId: string) => {
    if (!userId) throw new Error('Not authenticated');
    const req = await sendFriendRequest(userId, addresseeId);
    setFriends((prev) => [...prev, req]);
    return req;
  }, [userId]);

  const respond = useCallback(async (requestId: string, accept: boolean) => {
    const updated = await respondToFriendRequest(requestId, accept);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (accept) setFriends((prev) => [...prev, updated]);
    return updated;
  }, []);

  const removeFriend = useCallback(async (friendId: string) => {
    if (!userId) return;
    await unfriend(userId, friendId);
    setFriends((prev) => prev.filter((f) => f.requester_id !== friendId && f.addressee_id !== friendId));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { friends, requests, isLoading, error, refresh: load, sendRequest, respond, removeFriend };
}
