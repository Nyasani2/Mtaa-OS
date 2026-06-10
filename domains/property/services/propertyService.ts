// MTAA PROPERTY OS — PROPERTY SERVICE
// Direct Supabase calls for property operations

import { supabase } from "@/lib/supabase";
import type { Property, PropertyPhoto, PropertySearchFilters } from "../types";

export class PropertyService {
  // ─── CRUD ───

  async getProperties(filters?: PropertySearchFilters): Promise<Property[]> {
    let query = supabase
      .from("properties")
      .select("*, property_photos(*)")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (filters?.location) {
      query = query.or(`town.ilike.%${filters.location}%,county.ilike.%${filters.location}%,street.ilike.%${filters.location}%`);
    }
    if (filters?.property_type) {
      query = query.eq("property_type", filters.property_type);
    }
    if (filters?.listing_type) {
      query = query.eq("listing_type", filters.listing_type);
    }
    if (filters?.min_price !== undefined) {
      query = query.gte("price_per_night", filters.min_price).or(`price_per_month.gte.${filters.min_price}`);
    }
    if (filters?.max_price !== undefined) {
      query = query.lte("price_per_night", filters.max_price).or(`price_per_month.lte.${filters.max_price}`);
    }
    if (filters?.bedrooms !== undefined) {
      query = query.gte("bedrooms", filters.bedrooms);
    }
    if (filters?.bathrooms !== undefined) {
      query = query.gte("bathrooms", filters.bathrooms);
    }
    if (filters?.furnished !== undefined) {
      query = query.eq("furnished", filters.furnished);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getPropertyById(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from("properties")
      .select("*, property_photos(*), property_reviews(*, reviewer:profiles(full_name, avatar_url))")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async createProperty(property: Partial<Property>): Promise<Property> {
    const { data, error } = await supabase
      .from("properties")
      .insert(property)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
    const { data, error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteProperty(id: string): Promise<void> {
    const { error } = await supabase
      .from("properties")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  // ─── SEARCH ───

  async searchProperties(searchTerm: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .textSearch("search_vector", searchTerm)
      .eq("status", "active");
    if (error) throw error;
    return data || [];
  }

  async getFeaturedProperties(limit = 10): Promise<Property[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .order("view_count", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  async getRecentProperties(limit = 10): Promise<Property[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  // ─── PHOTOS ───

  async addPropertyPhoto(photo: Partial<PropertyPhoto>): Promise<PropertyPhoto> {
    const { data, error } = await supabase
      .from("property_photos")
      .insert(photo)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deletePropertyPhoto(photoId: string): Promise<void> {
    const { error } = await supabase.from("property_photos").delete().eq("id", photoId);
    if (error) throw error;
  }

  // ─── SAVED ───

  async saveProperty(userId: string, propertyId: string): Promise<void> {
    const { error } = await supabase
      .from("saved_properties")
      .insert({ user_id: userId, property_id: propertyId })
      .select();
    if (error && error.code !== "23505") throw error; // ignore duplicate
  }

  async unsaveProperty(userId: string, propertyId: string): Promise<void> {
    const { error } = await supabase
      .from("saved_properties")
      .delete()
      .eq("user_id", userId)
      .eq("property_id", propertyId);
    if (error) throw error;
  }

  async getSavedProperties(userId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from("saved_properties")
      .select("property:properties(*)")
      .eq("user_id", userId);
    if (error) throw error;
    return (data?.map((d: any) => d.property) as Property[]) || [];
  }

  // ─── AVAILABILITY ───

  async checkAvailability(propertyId: string, checkIn: string, checkOut: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("check_property_availability", {
      p_property_id: propertyId,
      p_check_in: checkIn,
      p_check_out: checkOut,
    });
    if (error) throw error;
    return data || false;
  }

  async getAvailabilityCalendar(propertyId: string, month: string): Promise<any[]> {
    const start = `${month}-01`;
    const end = `${month}-31`;
    const { data, error } = await supabase
      .from("property_availability")
      .select("*")
      .eq("property_id", propertyId)
      .gte("date", start)
      .lte("date", end)
      .order("date");
    if (error) throw error;
    return data || [];
  }
}

export const propertyService = new PropertyService();
