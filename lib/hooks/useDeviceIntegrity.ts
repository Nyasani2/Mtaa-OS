import { useState, useEffect } from 'react';
import { getDeviceSecurityStatus, SecurityStatus } from '@/lib/services/integrity-service';

export const useDeviceIntegrity = () => {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const result = await getDeviceSecurityStatus();
      setStatus(result);
      setLoading(false);
    };
    check();
  }, []);

  return { status, loading, isSecure: status?.riskLevel === 'low' || status?.riskLevel === 'medium' };
};
