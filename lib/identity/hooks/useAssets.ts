import { useIdentity } from './useIdentity';

export function useAssets() {
  const { assets, refresh } = useIdentity();
  return { assets, refresh };
}
export default useAssets;
