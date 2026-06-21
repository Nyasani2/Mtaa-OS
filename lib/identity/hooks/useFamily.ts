import { useIdentity } from './useIdentity';

export function useFamily() {
  const { family, refresh } = useIdentity();
  return { ...family, refresh };
}
export default useFamily;
