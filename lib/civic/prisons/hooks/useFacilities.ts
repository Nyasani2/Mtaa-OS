import { useState, useEffect } from 'react';
import { PrisonFacilitiesService } from '../services/prisonFacilities';

export function useFacilities() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    PrisonFacilitiesService.getFacilities()
      .then(setFacilities)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { facilities, loading, error };
}
