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
