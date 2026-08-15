// [CONSOLIDATED] Tribe types moved to domains/tribes/services/tribeService.ts
// All types re-exported from canonical source.
// Do not add new types here — use the canonical source instead.

export * from '../../domains/tribes/services/tribeService';

// === Missing type referenced by tribeService.ts ===
export interface TribeMessage {
  id: string;
  tribe_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'announcement';
  created_at: string;
  updated_at?: string;
}

export interface Tribe { id: string; name: string; slug?: string; description?: string; category?: string; country?: string; region?: string; language?: string; avatar_url?: string; cover_url?: string; member_count?: number; visibility?: string; status?: string; created_by?: string; creator_id?: string; [k: string]: any; }
export interface TribeMember { id?: string; tribe_id: string; user_id: string; role?: string; status?: string; user_profiles?: any; [k: string]: any; }
export interface TribePost { id: string; tribe_id: string; author_id?: string; content?: string; media_url?: string; thumbnail_url?: string; media_type?: string; likes_count?: number; comments_count?: number; shares_count?: number; created_at?: string; [k: string]: any; }
export interface TribeEvent { id: string; tribe_id: string; title: string; description?: string; starts_at?: string; ends_at?: string; location?: string; [k: string]: any; }
