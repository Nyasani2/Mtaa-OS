// @ts-nocheck
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useCreator() {
  const { creator, refresh } = useAuthStore();
  return { ...creator, refresh };
}
export default useCreator;
