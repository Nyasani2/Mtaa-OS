import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface PhoneContact {
  id: string;
  user_id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
  phoneNumbers: { label: string; number: string; isPrimary?: boolean }[];
  emails: { label: string; email: string }[];
  company?: string;
  jobTitle?: string;
  photoUrl?: string;
  isFavorite: boolean;
  isBlocked: boolean;
  notes?: string;
  whatsappNumber?: string;
  telegramUsername?: string;
  website?: string;
  source: string;
  nativeContactId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhoneCallLog {
  id: string;
  userId: string;
  contactId?: string;
  phoneNumber: string;
  contactName?: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'rejected';
  duration: number;
  startedAt: string;
  notes?: string;
}

interface PhoneStore {
  contacts: PhoneContact[];
  callLogs: PhoneCallLog[];
  favorites: PhoneContact[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchContacts: (userId: string) => Promise<void>;
  fetchCallLogs: (userId: string) => Promise<void>;
  searchContacts: (userId: string, query: string) => Promise<PhoneContact[]>;
  addContact: (contact: Partial<PhoneContact>) => Promise<PhoneContact>;
  updateContact: (id: string, updates: Partial<PhoneContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  addCallLog: (log: Partial<PhoneCallLog>) => Promise<void>;
  importContacts: (userId: string, contacts: Partial<PhoneContact>[]) => Promise<number>;
}

export const usePhoneStore = create<PhoneStore>((set, get) => ({
  contacts: [],
  callLogs: [],
  favorites: [],
  loading: false,
  error: null,

  fetchContacts: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('user_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('first_name', { ascending: true });
      if (error) throw error;
      const mapped = (data || []).map(mapDbToContact);
      set({
        contacts: mapped,
        favorites: mapped.filter(c => c.isFavorite),
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchCallLogs: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      set({ callLogs: (data || []).map(mapDbToCallLog) });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  searchContacts: async (userId: string, query: string) => {
    const { data, error } = await supabase
      .from('user_contacts')
      .select('*')
      .eq('user_id', userId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company.ilike.%${query}%`)
      .order('first_name', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapDbToContact);
  },

  addContact: async (contact: Partial<PhoneContact>) => {
    const dbContact = mapContactToDb(contact);
    const { data, error } = await supabase
      .from('user_contacts')
      .insert(dbContact)
      .select()
      .single();
    if (error) throw error;
    const newContact = mapDbToContact(data);
    set(state => ({
      contacts: [...state.contacts, newContact].sort((a, b) => a.firstName.localeCompare(b.firstName)),
      favorites: newContact.isFavorite ? [...state.favorites, newContact] : state.favorites,
    }));
    return newContact;
  },

  updateContact: async (id: string, updates: Partial<PhoneContact>) => {
    const dbUpdates = mapContactToDb(updates);
    const { data, error } = await supabase
      .from('user_contacts')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const updated = mapDbToContact(data);
    set(state => {
      const contacts = state.contacts.map(c => c.id === id ? updated : c).sort((a, b) => a.firstName.localeCompare(b.firstName));
      return {
        contacts,
        favorites: contacts.filter(c => c.isFavorite),
      };
    });
  },

  deleteContact: async (id: string) => {
    const { error } = await supabase.from('user_contacts').delete().eq('id', id);
    if (error) throw error;
    set(state => ({
      contacts: state.contacts.filter(c => c.id !== id),
      favorites: state.favorites.filter(c => c.id !== id),
    }));
  },

  toggleFavorite: async (id: string, isFavorite: boolean) => {
    const { error } = await supabase
      .from('user_contacts')
      .update({ is_favorite: isFavorite })
      .eq('id', id);
    if (error) throw error;
    set(state => {
      const contacts = state.contacts.map(c => c.id === id ? { ...c, isFavorite } : c);
      return { contacts, favorites: contacts.filter(c => c.isFavorite) };
    });
  },

  addCallLog: async (log: Partial<PhoneCallLog>) => {
    const dbLog = mapCallLogToDb(log);
    const { error } = await supabase.from('call_logs').insert(dbLog);
    if (error) throw error;
    const { fetchCallLogs } = get();
    if (log.userId) fetchCallLogs(log.userId);
  },

  importContacts: async (userId: string, contacts: Partial<PhoneContact>[]) => {
    const dbContacts = contacts.map(c => ({
      ...mapContactToDb(c),
      user_id: userId,
      source: 'phone_import',
    }));
    const { error } = await supabase.from('user_contacts').insert(dbContacts);
    if (error) throw error;
    const { fetchContacts } = get();
    await fetchContacts(userId);
    return dbContacts.length;
  },
}));

// ─── Mappers ───────────────────────────────────────────────────────
function mapDbToContact(db: any): PhoneContact {
  return {
    id: db.id,
    user_id: db.user_id,
    firstName: db.first_name || '',
    lastName: db.last_name || '',
    displayName: db.display_name || `${db.first_name || ''} ${db.last_name || ''}`.trim(),
    phone: db.phone_numbers?.[0]?.number || '',
    phoneNumbers: db.phone_numbers || [],
    emails: db.emails || [],
    company: db.company,
    jobTitle: db.job_title,
    photoUrl: db.photo_url,
    isFavorite: db.is_favorite || false,
    isBlocked: db.is_blocked || false,
    notes: db.notes,
    whatsappNumber: db.whatsapp_number,
    telegramUsername: db.telegram_username,
    website: db.website,
    source: db.source || 'manual',
    nativeContactId: db.native_contact_id,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapContactToDb(contact: Partial<PhoneContact>): any {
  const db: any = {};
  if (contact.firstName !== undefined) db.first_name = contact.firstName;
  if (contact.lastName !== undefined) db.last_name = contact.lastName;
  if (contact.phoneNumbers !== undefined) db.phone_numbers = contact.phoneNumbers;
  if (contact.emails !== undefined) db.emails = contact.emails;
  if (contact.company !== undefined) db.company = contact.company;
  if (contact.jobTitle !== undefined) db.job_title = contact.jobTitle;
  if (contact.photoUrl !== undefined) db.photo_url = contact.photoUrl;
  if (contact.isFavorite !== undefined) db.is_favorite = contact.isFavorite;
  if (contact.isBlocked !== undefined) db.is_blocked = contact.isBlocked;
  if (contact.notes !== undefined) db.notes = contact.notes;
  if (contact.whatsappNumber !== undefined) db.whatsapp_number = contact.whatsappNumber;
  if (contact.telegramUsername !== undefined) db.telegram_username = contact.telegramUsername;
  if (contact.website !== undefined) db.website = contact.website;
  if (contact.nativeContactId !== undefined) db.native_contact_id = contact.nativeContactId;
  return db;
}

function mapDbToCallLog(db: any): PhoneCallLog {
  return {
    id: db.id,
    userId: db.user_id,
    contactId: db.contact_id,
    phoneNumber: db.phone_number,
    contactName: db.contact_name,
    type: db.call_type || 'outgoing',
    duration: db.duration || 0,
    startedAt: db.started_at,
    notes: db.notes,
  };
}

function mapCallLogToDb(log: Partial<PhoneCallLog>): any {
  return {
    user_id: log.userId,
    contact_id: log.contactId,
    phone_number: log.phoneNumber,
    contact_name: log.contactName,
    call_type: log.type,
    duration: log.duration,
    started_at: log.startedAt || new Date().toISOString(),
    notes: log.notes,
  };
}
