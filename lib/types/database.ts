// Generated types from Supabase schema
// Run: npx supabase gen types typescript --project-id <id> --schema public > lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Add generated types here after running supabase gen types
    };
  };
}
