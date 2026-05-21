
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInstitutions, registerInstitution, updateInstitution } from '../services/institutionService';

export function useInstitutions(filters?: { county?: string; type?: string }) {
  return useQuery({
    queryKey: ['institutions', filters],
    queryFn: () => getInstitutions(filters),
  });
}

export function useRegisterInstitution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registerInstitution,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['institutions'] }),
  });
}
