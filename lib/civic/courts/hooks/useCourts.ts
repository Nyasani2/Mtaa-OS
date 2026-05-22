import { useState, useEffect } from 'react';
import { CourtHousesService } from '../services/courtHouses';

export function useCourts() {
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    CourtHousesService.getHouses()
      .then(setCourts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { courts, loading, error };
}
