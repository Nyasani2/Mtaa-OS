// hooks/usePhoneStore.ts
// React hook wrapper around phone Zustand store
// Imported by: app/(os)/phone/contacts.tsx

import { useEffect } from 'react';
import { usePhoneStore } from '@/domains/phone/state/phoneStore';

export function usePhoneStoreHook() {
  const store = usePhoneStore();

  useEffect(() => {
    store.fetchContacts();
    store.fetchCallLogs();
  }, []);

  return {
    contacts: store.contacts,
    favorites: store.favorites,
    recentCalls: store.recentCalls,
    loading: store.loading,
    error: store.error,
    addContact: store.addContact,
    updateContact: store.updateContact,
    deleteContact: store.deleteContact,
    toggleFavorite: store.toggleFavorite,
    searchContacts: store.searchContacts,
    getContactById: store.getContactById,
    logCall: store.logCall,
    refresh: () => {
      store.fetchContacts();
      store.fetchCallLogs();
    },
  };
}

export default usePhoneStoreHook;
