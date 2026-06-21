import { useIdentity } from './useIdentity';

export function useCreator() {
  const { creator, refresh } = useIdentity();
  return { ...creator, refresh };
}
export default useCreator;
