// lib/mtruck/services/addressService.ts
// Saved addresses for "Use Saved Address" button

import { supabase } from "@/lib/supabase";

export async function getSavedAddresses(userId: string) {
  const { data, error } = await supabase
    .from("saved_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveAddress(payload: {
  user_id: string;
  label: string;
  address_line?: string;
  city?: string;
  lat?: number;
  lng?: number;
  is_default?: boolean;
}) {
  const { data, error } = await supabase.from("saved_addresses").insert(payload).select().single();
  if (error) throw error;
  return data;
}
