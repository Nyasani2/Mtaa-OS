import { useState } from 'react';

export function useHealthRole() {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  return { selectedFacilityId, setSelectedFacilityId, role: 'admin' };
}
