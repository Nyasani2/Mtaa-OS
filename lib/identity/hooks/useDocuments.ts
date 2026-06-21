import { useIdentity } from './useIdentity';

export function useDocuments() {
  const { documents, refresh } = useIdentity();
  return { documents, refresh };
}
export default useDocuments;
