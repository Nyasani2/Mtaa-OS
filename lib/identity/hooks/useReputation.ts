import { useIdentity } from './useIdentity';

export function useReputation() {
  const { reputation, refresh } = useIdentity();
  return { ...reputation, refresh };
}
export default useReputation;
