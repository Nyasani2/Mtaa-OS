// @ts-nocheck
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useDocuments() {
  const { documents, refresh } = useAuthStore();
  return { documents, refresh };
}
export default useDocuments;
