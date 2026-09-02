// @ts-nocheck
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useBusiness() {
  const { business, refresh } = useAuthStore();
  return { ...business, refresh };
}
export default useBusiness;
