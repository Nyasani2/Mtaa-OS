import { useContext } from 'react';
import { IdentityContext, IdentityContextValue } from './identity-provider';

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
}

export { IdentityProvider } from './identity-provider';
