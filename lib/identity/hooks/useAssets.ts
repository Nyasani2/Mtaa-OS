import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useAssets() {
  const { assets, refresh } = useAuthStore();
  return { assets, refresh };
}
export default useAssets;
