import React, { useEffect } from 'react';
import { useCommandCentre } from './use-command-centre';

export function CommandCentreProvider({ children }: { children: React.ReactNode }) {
  const { loadModules } = useCommandCentre();

  useEffect(() => {
    loadModules();
  }, []);

  return <>{children}</>;
}
